import { useState, useCallback, useRef, useEffect } from 'react'
import { streamChat } from '@/api/chat'
import type { Message } from '@/types/chat'

const DURATIONS_KEY = 'ai-chat-durations'
const MAX_SAMPLES = 8

// Mediana czasów poprzednich odpowiedzi - podstawa szacowanego czasu oczekiwania
function readDurations(): number[] {
  try {
    const raw = localStorage.getItem(DURATIONS_KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function pushDuration(ms: number): number[] {
  const next = [...readDurations(), ms].slice(-MAX_SAMPLES)
  try {
    localStorage.setItem(DURATIONS_KEY, JSON.stringify(next))
  } catch {
    // ignorujemy brak dostępu do storage
  }
  return next
}

export function useChat(initialMessages: Message[] = [], model?: string) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [estimateMs, setEstimateMs] = useState(() => median(readDurations()))
  const [sessionTokens, setSessionTokens] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content,
      createdAt: Date.now(),
    }

    const assistantMessage: Message = {
      id: Math.random().toString(36).slice(2),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages([...updatedMessages, assistantMessage])
    setIsStreaming(true)
    setError(null)

    const startedAt = Date.now()
    setElapsedMs(0)
    setEstimateMs(median(readDurations()))
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAt), 250)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      for await (const event of streamChat(updatedMessages, model, controller.signal)) {
        if ('content' in event) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id
                ? { ...m, content: m.content + event.content }
                : m
            )
          )
        } else if ('stats' in event) {
          setMessages(prev =>
            prev.map(m => (m.id === assistantMessage.id ? { ...m, stats: event.stats } : m))
          )
          setSessionTokens(prev => prev + event.stats.promptTok + event.stats.genTok)
        }
      }
      setEstimateMs(median(pushDuration(Date.now() - startedAt)))
    } catch (err) {
      // Przerwanie przez użytkownika - zachowaj to, co już zostało napisane, bez błędu
      if (err instanceof DOMException && err.name === 'AbortError') {
        setMessages(prev => prev.filter(m => m.id !== assistantMessage.id || m.content !== ''))
      } else {
        setError(err instanceof Error ? err.message : 'Nieznany błąd')
        setMessages(prev => prev.filter(m => m.id !== assistantMessage.id))
      }
    } finally {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      abortRef.current = null
      setIsStreaming(false)
    }
  }, [messages, model])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, setMessages, isStreaming, error, sendMessage, stop, clearMessages, elapsedMs, estimateMs, sessionTokens }
}
