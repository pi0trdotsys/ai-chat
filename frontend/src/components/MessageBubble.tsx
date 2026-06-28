import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Message } from '@/types/chat'
import { Markdown } from './Markdown'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  isLast?: boolean
  onRegenerate?: () => void
  onEdit?: (id: string, content: string) => void
}

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors"
      style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}
      onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
    >
      {children}
    </button>
  )
}

export function MessageBubble({ message, isStreaming, isLast, onRegenerate, onEdit }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // brak schowka (nie-HTTPS) - ignorujemy
    }
  }

  const startEdit = () => { setDraft(message.content); setEditing(true) }
  const saveEdit = () => {
    const text = draft.trim()
    setEditing(false)
    if (text && text !== message.content) onEdit?.(message.id, text)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group flex gap-2 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-medium"
        style={{
          width: 28, height: 28,
          background: isUser ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,rgba(167,139,250,0.3),rgba(96,165,250,0.3))',
          border: isUser ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(167,139,250,0.3)',
          color: isUser ? 'rgba(255,255,255,0.7)' : 'rgba(167,139,250,0.9)',
        }}
      >
        {isUser ? '👤' : '🐬'}
      </div>

      <div className={`flex flex-col gap-1 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="px-3 py-2 text-sm leading-relaxed w-full"
          style={{
            borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: isUser ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)',
            border: isUser ? '0.5px solid rgba(167,139,250,0.3)' : '0.5px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {editing ? (
            <div className="flex flex-col gap-2" style={{ minWidth: 220 }}>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
                  if (e.key === 'Escape') setEditing(false)
                }}
                autoFocus
                rows={Math.min(8, draft.split('\n').length + 1)}
                className="bg-transparent border-none outline-none text-sm resize-none w-full"
                style={{ color: 'rgba(255,255,255,0.95)', lineHeight: '1.5', fontFamily: 'inherit' }}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditing(false)} className="text-xs px-2 py-1 rounded-md" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Anuluj
                </button>
                <button
                  onClick={saveEdit}
                  className="text-xs px-2.5 py-1 rounded-md"
                  style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', color: '#fff' }}
                >
                  Zapisz i wyślij
                </button>
              </div>
            </div>
          ) : isStreaming && !message.content ? (
            <span className="flex gap-1 items-center py-0.5">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'rgba(167,139,250,0.7)' }}
                />
              ))}
            </span>
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : isStreaming ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <>
              <Markdown content={message.content} />
              {message.stats && (() => {
                const s = message.stats
                const parts = [
                  `${s.promptTok} → ${s.genTok} tok`,
                  `${s.tps.toString().replace('.', ',')} tok/s`,
                ]
                if (s.responseTimeMs != null) parts.push(`${(s.responseTimeMs / 1000).toFixed(0)} s`)
                if (s.energyKWh != null) parts.push(`${(s.energyKWh * 1000).toFixed(2)} Wh`)
                if (s.waterL != null) parts.push(`${(s.waterL * 1000).toFixed(1)} ml`)
                return (
                  <div className="mt-2 pt-1.5" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
                    <span
                      style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.01em' }}
                      title="tokeny wejściowe → wygenerowane · tempo · czas · energia · woda (orientacyjnie)"
                    >
                      {parts.join('   ·   ')}
                    </span>
                  </div>
                )
              })()}
            </>
          )}
        </div>

        {/* Pasek akcji - pojawia się po najechaniu, nie podczas edycji/streamingu */}
        {!editing && !isStreaming && (
          <div
            className={`flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{fmtTime(message.createdAt)}</span>
            {!isUser && message.content && (
              <IconButton onClick={copy} label={copied ? 'Skopiowano' : 'Kopiuj odpowiedź'}>
                {copied ? '✓ skopiowano' : '⧉ kopiuj'}
              </IconButton>
            )}
            {!isUser && isLast && onRegenerate && (
              <IconButton onClick={onRegenerate} label="Wygeneruj odpowiedź od nowa">↻ ponów</IconButton>
            )}
            {isUser && onEdit && (
              <IconButton onClick={startEdit} label="Edytuj i wyślij ponownie">✎ edytuj</IconButton>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
