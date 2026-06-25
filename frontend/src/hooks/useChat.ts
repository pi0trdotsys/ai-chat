import { useState, useCallback } from 'react'
import { streamChat } from '@/api/chat'
import type { Message } from '@/types/chat'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    try {
      for await (const chunk of streamChat(updatedMessages)) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id
              ? { ...m, content: m.content + chunk }
              : m
          )
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd')
      setMessages(prev => prev.filter(m => m.id !== assistantMessage.id))
    } finally {
      setIsStreaming(false)
    }
  }, [messages])

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, isStreaming, error, sendMessage, clearMessages }
}
