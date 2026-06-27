import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import { Ollama } from 'ollama'

const app = express()
const ollama = new Ollama({ host: process.env.OLLAMA_URL || 'http://localhost:11434' })
const JWT_SECRET = process.env.JWT_SECRET!
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD!

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Za dużo zapytań, poczekaj chwilę.' },
})
app.use('/api/', limiter)

app.post('/api/token', (req, res) => {
  const { password } = req.body as { password: string }
  if (password !== ACCESS_PASSWORD) {
    res.status(401).json({ error: 'Nieprawidłowe hasło' })
    return
  }
  const token = jwt.sign({}, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
})

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    res.status(401).json({ error: 'Brak tokenu' })
    return
  }
  try {
    jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Nieprawidłowy token' })
  }
}

app.post('/api/chat', requireAuth, async (req, res) => {
  const { messages, model = 'dolphin3:8b' } = req.body as {
    messages: { role: string; content: string }[]
    model?: string
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const systemPrompt = { role: 'system', content: 'Jesteś pomocnym asystentem. Zawsze odpowiadaj po polsku, używając poprawnej polszczyzny.' }
  const messagesWithSystem = [systemPrompt, ...messages]

  try {
    const stream = await ollama.chat({ model, messages: messagesWithSystem, stream: true })
    for await (const chunk of stream) {
      const content = chunk.message.content
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`)
      }
    }
    res.write('data: [DONE]\n\n')
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('Ollama error:', errMsg)
    res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`)
  } finally {
    res.end()
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(3001, () => console.log('Backend działa na porcie 3001'))
