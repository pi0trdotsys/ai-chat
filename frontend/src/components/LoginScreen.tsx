import { useState } from 'react'
import { motion } from 'framer-motion'
import { fetchToken } from '@/api/chat'

interface LoginScreenProps {
  onLogin: () => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = await fetchToken(password)
      localStorage.setItem('token', token)
      onLogin()
    } catch {
      setError('Nieprawidłowe hasło')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'}}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm mx-4"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div style={{width:10,height:10,borderRadius:'50%',background:'linear-gradient(135deg,#a78bfa,#60a5fa)'}} />
            <h1 className="text-2xl font-medium text-white tracking-tight">AI Chat</h1>
          </div>
          <p style={{color:'rgba(255,255,255,0.4)'}} className="text-sm">Wprowadź hasło dostępu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Hasło"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              background:'rgba(255,255,255,0.07)',
              border:'0.5px solid rgba(255,255,255,0.15)',
              color:'rgba(255,255,255,0.9)',
            }}
            autoFocus
          />
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
              {error}
            </motion.p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl py-3 text-sm font-medium transition-opacity disabled:opacity-40"
            style={{background:'linear-gradient(135deg,#a78bfa,#60a5fa)',color:'white'}}
          >
            {loading ? 'Logowanie...' : 'Wejdź'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
