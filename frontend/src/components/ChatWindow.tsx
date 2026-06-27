import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@/hooks/useChat'
import { useHealth } from '@/hooks/useHealth'
import { useModels } from '@/hooks/useModels'
import { MessageBubble } from './MessageBubble'
import { Sidebar } from './Sidebar'
import { ModelPicker } from './ModelPicker'
import { PersonaPanel } from './PersonaPanel'
import { describeModel } from '@/lib/models'
import {
  loadConversations,
  saveConversations,
  emptyConversation,
  deriveTitle,
  type Conversation,
} from '@/lib/conversations'

const formatTime = (ms: number) => {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const formatTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`)

const MODEL_KEY = 'ai-chat-model'

export function ChatWindow({ onLogout }: { onLogout: () => void }) {
  const [boot] = useState(loadConversations)
  const [conversations, setConversations] = useState<Conversation[]>(boot.conversations)
  const [activeId, setActiveId] = useState<string>(boot.activeId)
  const initialMessages = boot.conversations.find(c => c.id === boot.activeId)!.messages

  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem(MODEL_KEY) || '')
  const activeConv = conversations.find(c => c.id === activeId)
  const { messages, setMessages, isStreaming, error, sendMessage, regenerate, editMessage, stop, clearMessages, elapsedMs, estimateMs, sessionTokens } =
    useChat(initialMessages, selectedModel || undefined, activeConv?.systemPrompt)
  const health = useHealth()
  const { models, defaultModel } = useModels()

  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isNearBottom = () => {
    const el = scrollRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
    setAtBottom(true)
  }

  const [greeting, setGreeting] = useState<{ emoji: string; text: string } | null>(null)
  const greetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (greetTimer.current) clearTimeout(greetTimer.current) }, [])

  const handleModelChange = (name: string) => {
    setSelectedModel(name)
    localStorage.setItem(MODEL_KEY, name)
    const meta = describeModel(name)
    setGreeting({ emoji: meta.emoji, text: meta.greeting })
    if (greetTimer.current) clearTimeout(greetTimer.current)
    greetTimer.current = setTimeout(() => setGreeting(null), 9000)
  }

  const [modelHintSeen, setModelHintSeen] = useState(() => !!localStorage.getItem('ai-chat-model-hint'))
  const dismissModelHint = () => {
    setModelHintSeen(true)
    localStorage.setItem('ai-chat-model-hint', '1')
  }

  // Live licznik tokenów odpowiedzi w trakcie generacji (przybliżenie ~4 znaki/token)
  const last = messages[messages.length - 1]
  const liveTokens = isStreaming && last?.role === 'assistant' && last.content
    ? Math.max(1, Math.round(last.content.length / 4))
    : 0

  useEffect(() => {
    // Przewijaj automatycznie tylko, gdy użytkownik jest przy dole - nie wyrywaj go z czytania
    if (isNearBottom()) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Esc zatrzymuje generowanie
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isStreaming) stop() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isStreaming, stop])

  // Zapisz bieżące wiadomości do aktywnej rozmowy; auto-tytuł tylko gdy nie zmieniono ręcznie
  useEffect(() => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== activeId) return c
        const changed =
          c.messages.length !== messages.length ||
          (messages.length > 0 && c.messages[c.messages.length - 1]?.content !== messages[messages.length - 1]?.content)
        return {
          ...c,
          messages,
          title: c.title === 'Nowa rozmowa' ? deriveTitle(messages) : c.title,
          updatedAt: changed ? Date.now() : c.updatedAt,
        }
      })
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

  const handleRename = (id: string, title: string) => {
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, title } : c)))
  }

  const [showPersona, setShowPersona] = useState(false)
  const handlePersonaChange = (text: string) => {
    setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, systemPrompt: text.trim() || undefined } : c)))
  }

  const handleNew = () => {
    const conv = emptyConversation()
    setConversations(prev => [conv, ...prev])
    setActiveId(conv.id)
    setMessages([])
    setSidebarOpen(false)
  }

  const handleDelete = (id: string) => {
    const remaining = conversations.filter(c => c.id !== id)
    // Jeśli usuwamy ostatnią rozmowę, twórz świeżą pustą
    const list = remaining.length > 0 ? remaining : [emptyConversation()]
    setConversations(list)
    if (id === activeId) {
      const next = list[0]
      setActiveId(next.id)
      setMessages(next.messages)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    setGreeting(null)
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
          onDelete={handleDelete}
          onRename={handleRename}
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
          onDelete={handleDelete}
          onRename={handleRename}
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

          <ModelPicker
            health={health}
            models={models}
            value={selectedModel}
            defaultModel={defaultModel || health.model}
            onChange={handleModelChange}
            hint={!modelHintSeen}
            onDismissHint={dismissModelHint}
          />

          <div className="flex items-center gap-3">
            {sessionTokens > 0 && (
              <span
                className="text-xs"
                style={{color:'rgba(255,255,255,0.4)',fontFamily:'ui-monospace,monospace'}}
                title="Łącznie fragmentów tekstu przetworzonych w tej sesji (Twoje pytania + odpowiedzi modelu). Im więcej, tym więcej pracy wykonał model."
              >
                {formatTokens(sessionTokens)} fragm.
              </span>
            )}
            <button
              onClick={() => setShowPersona(true)}
              className="text-xs flex items-center gap-1"
              style={{color: activeConv?.systemPrompt ? 'rgba(167,139,250,0.9)' : 'rgba(255,255,255,0.3)'}}
              title="Ustaw personę / własne instrukcje dla tej rozmowy"
            >
              🎭 Persona{activeConv?.systemPrompt ? ' •' : ''}
            </button>
            <button onClick={clearMessages} className="text-xs" style={{color:'rgba(255,255,255,0.3)'}}>
              Wyczyść
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showPersona && (
            <PersonaPanel
              value={activeConv?.systemPrompt ?? ''}
              onSave={(text) => { handlePersonaChange(text); setShowPersona(false) }}
              onClose={() => setShowPersona(false)}
            />
          )}
        </AnimatePresence>

        <div
          ref={scrollRef}
          onScroll={() => setAtBottom(isNearBottom())}
          className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4 relative"
        >
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex items-center justify-center flex-1 min-h-48 px-2"
              >
                <div
                  className="max-w-md w-full text-center rounded-3xl px-7 py-8"
                  style={{
                    background:'linear-gradient(160deg,rgba(167,139,250,0.12),rgba(96,165,250,0.06))',
                    border:'0.5px solid rgba(167,139,250,0.22)',
                    backdropFilter:'blur(20px)',
                    boxShadow:'0 8px 40px rgba(120,80,255,0.12)',
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    style={{fontSize:44,lineHeight:1,marginBottom:14}}
                  >
                    🐬
                  </motion.div>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span
                      className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                      style={{background:'rgba(34,197,94,0.15)',border:'0.5px solid rgba(34,197,94,0.35)',color:'#86efac',letterSpacing:'0.05em'}}
                    >
                      UNCENSORED
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold mb-2.5" style={{color:'rgba(255,255,255,0.95)'}}>
                    Pytaj o cokolwiek
                  </h2>
                  <p className="text-sm leading-relaxed" style={{color:'rgba(255,255,255,0.65)'}}>
                    Działam w wersji <strong style={{color:'rgba(167,139,250,0.95)'}}>bez cenzury</strong>. W miarę
                    moich możliwości odpowiem na każde pytanie i rozwieję każdą wątpliwość, niezależnie od tematu
                    rozmowy. Pytaj śmiało i bez ograniczeń.
                  </p>
                </div>
              </motion.div>
            )}
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
                isLast={i === messages.length - 1}
                onRegenerate={regenerate}
                onEdit={editMessage}
              />
            ))}
          </AnimatePresence>

          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-1 py-1"
            >
              <div
                className="flex items-center gap-2 text-xs rounded-full px-3.5 py-1.5"
                style={{background:'rgba(167,139,250,0.1)',border:'0.5px solid rgba(167,139,250,0.22)',color:'rgba(255,255,255,0.75)'}}
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  style={{display:'inline-block',width:11,height:11,borderRadius:'50%',border:'1.5px solid rgba(167,139,250,0.3)',borderTopColor:'rgba(167,139,250,0.95)'}}
                />
                <span style={{fontFamily:'ui-monospace,monospace',fontVariantNumeric:'tabular-nums'}}>
                  {formatTime(elapsedMs)}
                </span>
                {estimateMs > 0 && (
                  <span style={{color:'rgba(255,255,255,0.4)'}}>
                    · szac. ~{formatTime(estimateMs)}
                  </span>
                )}
                {liveTokens > 0 && (
                  <span style={{color:'rgba(255,255,255,0.4)'}} title="Tyle fragmentów tekstu model już napisał">
                    · napisał ≈ {liveTokens}
                  </span>
                )}
              </div>
              <p style={{fontSize:10,color:'rgba(255,255,255,0.28)'}}>
                Trudniejsze pytania mogą potrwać dłużej - odpowiedź na pewno przyjdzie.
              </p>
            </motion.div>
          )}

          <AnimatePresence>
            {greeting && (
              <motion.div
                key="greeting"
                initial={{ opacity: 0, y: 14, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="flex gap-2 items-end self-start"
                style={{maxWidth:'80%'}}
              >
                <motion.div
                  initial={{ rotate: -20 }}
                  animate={{ rotate: [0, -12, 12, -6, 0] }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="flex-shrink-0 flex items-center justify-center rounded-full"
                  style={{
                    width:28,height:28,fontSize:15,
                    background:'linear-gradient(135deg,rgba(167,139,250,0.35),rgba(96,165,250,0.35))',
                    border:'0.5px solid rgba(167,139,250,0.4)',
                  }}
                >
                  {greeting.emoji}
                </motion.div>
                <div
                  className="px-3 py-2 text-sm leading-relaxed relative overflow-hidden"
                  style={{
                    borderRadius:'14px 14px 14px 4px',
                    background:'linear-gradient(135deg,rgba(167,139,250,0.16),rgba(96,165,250,0.1))',
                    border:'0.5px solid rgba(167,139,250,0.3)',
                    color:'rgba(255,255,255,0.92)',
                    backdropFilter:'blur(10px)',
                  }}
                >
                  <motion.div
                    aria-hidden
                    initial={{ x: '-120%' }}
                    animate={{ x: '220%' }}
                    transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.2 }}
                    style={{
                      position:'absolute',top:0,bottom:0,width:'40%',
                      background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)',
                      pointerEvents:'none',
                    }}
                  />
                  {greeting.text}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
              {error}
            </motion.p>
          )}
          <div ref={bottomRef} />
        </div>

        <AnimatePresence>
          {!atBottom && (
            <motion.button
              type="button"
              onClick={() => scrollToBottom()}
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Przewiń na dół"
              className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center rounded-full"
              style={{
                bottom: 88, width: 36, height: 36,
                background:'rgba(40,36,70,0.85)', backdropFilter:'blur(12px)',
                border:'0.5px solid rgba(167,139,250,0.35)', boxShadow:'0 6px 20px rgba(0,0,0,0.4)',
                color:'rgba(255,255,255,0.85)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

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
            {isStreaming ? (
              <motion.button
                onClick={stop}
                aria-label="Zatrzymaj generowanie"
                title="Zatrzymaj (Esc)"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="flex-shrink-0 flex items-center justify-center rounded-xl"
                style={{width:34,height:34,background:'linear-gradient(135deg,#f87171,#ef4444)',border:'none'}}
              >
                <span style={{display:'block',width:11,height:11,borderRadius:3,background:'#fff'}} />
              </motion.button>
            ) : (
              <button
                onClick={() => handleSubmit()}
                disabled={!input.trim()}
                className="flex-shrink-0 flex items-center justify-center rounded-xl transition-opacity disabled:opacity-40"
                style={{width:34,height:34,background:'linear-gradient(135deg,#a78bfa,#60a5fa)',border:'none'}}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                </svg>
              </button>
            )}
          </div>
          <p className="text-center mt-1.5" style={{fontSize:10,color:'rgba(255,255,255,0.18)'}}>
            {isStreaming ? 'Esc = zatrzymaj generowanie' : 'Enter = wyślij · Shift+Enter = nowa linia'}
          </p>
        </div>
      </div>
    </div>
  )
}
