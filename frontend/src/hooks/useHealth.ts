import { useEffect, useState } from 'react'

export interface Health {
  status: 'ok' | 'degraded' | 'checking'
  ollama: 'up' | 'down' | 'unknown'
  model: string
  modelLoaded: boolean
}

const INITIAL: Health = { status: 'checking', ollama: 'unknown', model: '…', modelLoaded: false }

export function useHealth(intervalMs = 15000) {
  const [health, setHealth] = useState<Health>(INITIAL)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const res = await fetch('/api/health')
        const data = (await res.json()) as Health
        if (!cancelled) setHealth(data)
      } catch {
        if (!cancelled) setHealth({ status: 'degraded', ollama: 'down', model: INITIAL.model, modelLoaded: false })
      }
    }

    check()
    const id = setInterval(check, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [intervalMs])

  return health
}
