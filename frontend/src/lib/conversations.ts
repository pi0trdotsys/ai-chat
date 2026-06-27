import type { Message } from '@/types/chat'

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
  systemPrompt?: string
}

const KEY = 'ai-chat-conversations'
const ACTIVE_KEY = 'ai-chat-active'

export const newId = () => Math.random().toString(36).slice(2)

export function emptyConversation(): Conversation {
  const now = Date.now()
  return { id: newId(), title: 'Nowa rozmowa', createdAt: now, updatedAt: now, messages: [] }
}

// Migracja starego formatu (pole `date` zamiast createdAt/updatedAt)
function normalize(c: Partial<Conversation> & { date?: string }): Conversation {
  const now = Date.now()
  return {
    id: c.id ?? newId(),
    title: c.title ?? 'Nowa rozmowa',
    createdAt: c.createdAt ?? now,
    updatedAt: c.updatedAt ?? c.createdAt ?? now,
    messages: c.messages ?? [],
    systemPrompt: c.systemPrompt,
  }
}

export function loadConversations(): { conversations: Conversation[]; activeId: string } {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Conversation[]) : []
    if (parsed.length > 0) {
      const conversations = parsed.map(normalize)
      const storedActive = localStorage.getItem(ACTIVE_KEY)
      const activeId = conversations.some(c => c.id === storedActive) ? storedActive! : conversations[0].id
      return { conversations, activeId }
    }
  } catch {
    // uszkodzony zapis - startujemy od nowa
  }
  const fresh = emptyConversation()
  return { conversations: [fresh], activeId: fresh.id }
}

export function saveConversations(conversations: Conversation[], activeId: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(conversations))
    localStorage.setItem(ACTIVE_KEY, activeId)
  } catch {
    // brak miejsca / tryb prywatny - ignorujemy
  }
}

// Tytuł z pierwszego pytania użytkownika
export function deriveTitle(messages: Message[]): string {
  const first = messages.find(m => m.role === 'user')?.content.trim()
  if (!first) return 'Nowa rozmowa'
  const oneLine = first.replace(/\s+/g, ' ')
  return oneLine.length > 38 ? oneLine.slice(0, 38) + '…' : oneLine
}

// Etykieta grupy dat dla sidebara
export function dateGroup(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const dayMs = 86400000
  const diffDays = Math.round((startOf(today) - startOf(d)) / dayMs)

  if (diffDays <= 0) return 'Dziś'
  if (diffDays === 1) return 'Wczoraj'
  if (diffDays < 7) return 'W tym tygodniu'
  if (diffDays < 30) return 'W tym miesiącu'
  return d.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}
