import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import { Ollama } from 'ollama'
import { appendFile, mkdir } from 'fs/promises'
import { dirname } from 'path'

const app = express()
const ollama = new Ollama({ host: process.env.OLLAMA_URL || 'http://localhost:11434' })
const JWT_SECRET = process.env.JWT_SECRET!
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD!

const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`)

const CONVO_LOG = process.env.CONVO_LOG || '/app/logs/conversations.jsonl'
const logConversation = async (record: object) => {
  try {
    await mkdir(dirname(CONVO_LOG), { recursive: true })
    await appendFile(CONVO_LOG, JSON.stringify(record) + '\n')
  } catch (err) {
    log(`✗ Nie udało się zapisać rozmowy: ${err instanceof Error ? err.message : String(err)}`)
  }
}

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

app.use((req, _res, next) => {
  log(`${req.method} ${req.path} | ip=${req.ip}`)
  next()
})

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

  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
  const preview = lastUser.replace(/\s+/g, ' ').slice(0, 80)
  log(`▶ chat | model=${model} | wiadomości=${messages.length} | pytanie="${preview}${lastUser.length > 80 ? '…' : ''}"`)

  const started = Date.now()
  let answer = ''
  try {
    const stream = await ollama.chat({ model, messages: messagesWithSystem, stream: true })
    for await (const chunk of stream) {
      const content = chunk.message.content
      if (content) {
        answer += content
        res.write(`data: ${JSON.stringify({ content })}\n\n`)
      }
      if (chunk.done) {
        const wallMs = Date.now() - started
        const ns = 1e9
        const loadMs = (chunk.load_duration ?? 0) / 1e6
        const promptTok = chunk.prompt_eval_count ?? 0
        const promptMs = (chunk.prompt_eval_duration ?? 0) / 1e6
        const genTok = chunk.eval_count ?? 0
        const genSec = (chunk.eval_duration ?? 0) / ns
        const tps = genSec > 0 ? (genTok / genSec).toFixed(1) : '–'
        log(
          `✓ done | ${wallMs}ms (load ${loadMs.toFixed(0)}ms) | ` +
          `prompt ${promptTok} tok / ${promptMs.toFixed(0)}ms | ` +
          `odpowiedź ${genTok} tok / ${genSec.toFixed(2)}s | ${tps} tok/s`
        )
        await logConversation({
          ts: new Date().toISOString(),
          ip: req.ip,
          model,
          question: lastUser,
          answer,
          stats: { wallMs, loadMs, promptTok, promptMs, genTok, genSec, tps },
        })
      }
    }
    res.write('data: [DONE]\n\n')
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    log(`✗ Ollama error po ${Date.now() - started}ms: ${errMsg}`)
    await logConversation({
      ts: new Date().toISOString(),
      ip: req.ip,
      model,
      question: lastUser,
      answer,
      error: errMsg,
    })
    res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`)
  } finally {
    res.end()
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(3001, () => console.log('Backend działa na porcie 3001'))
