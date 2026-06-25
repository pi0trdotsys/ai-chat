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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">AI Chat</h1>
          <p className="text-zinc-500 text-sm mt-1">Wprowadź hasło dostępu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Hasło"
            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
            autoFocus
          />
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-white text-zinc-950 rounded-xl py-3 text-sm font-medium disabled:opacity-40 transition-opacity hover:bg-zinc-100"
          >
            {loading ? 'Logowanie...' : 'Wejdź'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
