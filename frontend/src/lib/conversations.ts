import type { Message } from '@/types/chat'

export interface Conversation {
  id: string
  title: string
  date: string
  messages: Message[]
}

const KEY = 'ai-chat-conversations'
const ACTIVE_KEY = 'ai-chat-active'

export const newId = () => Math.random().toString(36).slice(2)

export function emptyConversation(): Conversation {
  return { id: newId(), title: 'Nowa rozmowa', date: 'Dziś', messages: [] }
}

export function loadConversations(): { conversations: Conversation[]; activeId: string } {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Conversation[]) : []
    if (parsed.length > 0) {
      const storedActive = localStorage.getItem(ACTIVE_KEY)
      const activeId = parsed.some(c => c.id === storedActive) ? storedActive! : parsed[0].id
      return { conversations: parsed, activeId }
    }
  } catch {
    // uszkodzony zapis — startujemy od nowa
  }
  const fresh = emptyConversation()
  return { conversations: [fresh], activeId: fresh.id }
}

export function saveConversations(conversations: Conversation[], activeId: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(conversations))
    localStorage.setItem(ACTIVE_KEY, activeId)
  } catch {
    // brak miejsca / tryb prywatny — ignorujemy
  }
}

// Tytuł z pierwszego pytania użytkownika
export function deriveTitle(messages: Message[]): string {
  const first = messages.find(m => m.role === 'user')?.content.trim()
  if (!first) return 'Nowa rozmowa'
  const oneLine = first.replace(/\s+/g, ' ')
  return oneLine.length > 38 ? oneLine.slice(0, 38) + '…' : oneLine
}
