export interface MessageStats {
  promptTok: number
  genTok: number
  tps: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  stats?: MessageStats
}

export interface TokenResponse {
  token: string
}

// Zdarzenia ze strumienia SSE
export type ChatEvent = { content: string } | { stats: MessageStats }
