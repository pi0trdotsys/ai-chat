import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@/hooks/useChat'
import { useHealth } from '@/hooks/useHealth'
import { MessageBubble } from './MessageBubble'
import { Sidebar } from './Sidebar'
import {
  loadConversations,
  saveConversations,
  emptyConversation,
  deriveTitle,
  type Conversation,
} from '@/lib/conversations'

export function ChatWindow({ onLogout }: { onLogout: () => void }) {
  const [boot] = useState(loadConversations)
  const [conversations, setConversations] = useState<Conversation[]>(boot.conversations)
  const [activeId, setActiveId] = useState<string>(boot.activeId)
  const initialMessages = boot.conversations.find(c => c.id === boot.activeId)!.messages

  const { messages, setMessages, isStreaming, error, sendMessage, clearMessages } = useChat(initialMessages)
  const health = useHealth()

  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Zapisz bieżące wiadomości do aktywnej rozmowy + wygeneruj tytuł
  useEffect(() => {
    setConversations(prev =>
      prev.map(c => (c.id === activeId ? { ...c, messages, title: deriveTitle(messages) } : c))
    )
  }, [messages, activeId])

  // Utrwal w localStorage (pomijamy zapis w trakcie streamingu, zapis końcowy gdy się zakończy)
  useEffect(() => {
    if (!isStreaming) saveConversations(conversations, activeId)
  }, [conversations, activeId, isStreaming])

  const handleSelect = (id: string) => {
    if (id === activeId) return
    const conv = conversations.find(c => c.id === id)
    if (!conv) return
    setActiveId(id)
    setMessages(conv.messages)
    setSidebarOpen(false)
  }

  const handleNew = () => {
    const conv = emptyConversation()
    setConversations(prev => [conv, ...prev])
    setActiveId(conv.id)
    setMessages([])
    setSidebarOpen(false)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const handleInputNative = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget
    setInput(ta.value)
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  // Status połączenia z kontenerem modelu
  const statusColor =
    health.status === 'checking' ? '#9ca3af'
    : health.ollama === 'down' ? '#ef4444'
    : !health.modelLoaded ? '#f59e0b'
    : '#22c55e'
  const statusText =
    health.status === 'checking' ? 'Sprawdzanie połączenia…'
    : health.ollama === 'down' ? 'Brak połączenia z modelem'
    : !health.modelLoaded ? 'Połączono, model niezaładowany'
    : 'Połączono'

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{background:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)'}}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{background:'radial-gradient(ellipse at 20% 50%,rgba(120,80,255,0.12) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(0,180,255,0.08) 0%,transparent 50%)'}}
      />

      <div className="hidden md:flex h-full" style={{width:220,flexShrink:0}}>
        <Sidebar
          isOpen={true}
          onClose={() => {}}
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={handleNew}
          onLogout={onLogout}
        />
      </div>

      <div className="md:hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={handleNew}
          onLogout={onLogout}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{borderBottom:'0.5px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex flex-col gap-1 p-1"
          >
            {[0,1,2].map(i => (
              <span key={i} style={{display:'block',width:18,height:1.5,borderRadius:2,background:'rgba(255,255,255,0.6)'}} />
            ))}
          </button>

          <div
            className="flex items-center gap-2 text-xs rounded-full px-3 py-1"
            style={{background:'rgba(167,139,250,0.1)',border:'0.5px solid rgba(167,139,250,0.2)',color:'rgba(167,139,250,0.85)'}}
            title={statusText}
          >
            <motion.span
              animate={health.status === 'checking' ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
              transition={{ duration: 1.2, repeat: health.status === 'checking' ? Infinity : 0 }}
              style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:statusColor,boxShadow:`0 0 6px ${statusColor}`}}
            />
            <span style={{fontFamily:'ui-monospace,monospace'}}>{health.model}</span>
          </div>

          <button onClick={clearMessages} className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>
            Wyczyść
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center flex-1 min-h-48"
              >
                <p className="text-sm" style={{color:'rgba(255,255,255,0.2)'}}>Zadaj pytanie, żeby zacząć.</p>
              </motion.div>
            )}
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === ''}
              />
            ))}
          </AnimatePresence>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
              {error}
            </motion.p>
          )}
          <div ref={bottomRef} />
        </div>

        <div
          className="px-3 pb-4 pt-2 flex-shrink-0"
          style={{borderTop:'0.5px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)'}}
        >
          <div
            className="flex gap-2 items-end rounded-2xl px-3 py-2"
            style={{background:'rgba(255,255,255,0.06)',backdropFilter:'blur(20px)',border:'0.5px solid rgba(255,255,255,0.12)'}}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
            onInput={handleInputNative}
              onKeyDown={handleKeyDown}
              placeholder="Napisz wiadomość…"
              rows={1}
              disabled={isStreaming}
              className="flex-1 bg-transparent border-none outline-none text-sm resize-none"
              style={{color:'rgba(255,255,255,0.9)',lineHeight:'1.5',maxHeight:120,fontFamily:'inherit'}}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isStreaming}
              className="flex-shrink-0 flex items-center justify-center rounded-xl transition-opacity disabled:opacity-40"
              style={{width:34,height:34,background:'linear-gradient(135deg,#a78bfa,#60a5fa)',border:'none'}}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
              </svg>
            </button>
          </div>
          <p className="text-center mt-1.5" style={{fontSize:10,color:'rgba(255,255,255,0.18)'}}>
            Enter = wyślij · Shift+Enter = nowa linia
          </p>
        </div>
      </div>
    </div>
  )
}
