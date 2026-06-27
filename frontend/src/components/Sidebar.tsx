import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export interface Conversation {
  id: string
  title: string
  date: string
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onLogout: () => void
}

export function Sidebar({ isOpen, onClose, conversations, activeId, onSelect, onNew, onDelete, onLogout }: SidebarProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-20 md:hidden"
            style={{background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)'}}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full z-30 flex flex-col md:relative md:translate-x-0"
        style={{
          width: 220,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          borderRight: '0.5px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{padding:'16px 14px 12px',borderBottom:'0.5px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center gap-2 mb-3">
            <div style={{width:8,height:8,borderRadius:'50%',background:'linear-gradient(135deg,#a78bfa,#60a5fa)'}} />
            <span className="text-sm font-medium" style={{color:'rgba(255,255,255,0.9)'}}>AI Chat</span>
          </div>
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 text-xs rounded-lg px-3 py-2 transition-colors"
            style={{background:'rgba(255,255,255,0.07)',border:'0.5px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)'}}
          >
            + Nowa rozmowa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
          {conversations.length === 0 && (
            <p className="text-xs text-center mt-4" style={{color:'rgba(255,255,255,0.25)'}}>Brak rozmów</p>
          )}
          {conversations.map(c => {
            const active = activeId === c.id
            return (
              <div
                key={c.id}
                onMouseEnter={() => setHovered(c.id)}
                onMouseLeave={() => setHovered(h => (h === c.id ? null : h))}
                onClick={() => { onSelect(c.id) }}
                className="group w-full flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                style={{
                  background: active ? 'rgba(167,139,250,0.15)' : 'transparent',
                  border: active ? '0.5px solid rgba(167,139,250,0.25)' : '0.5px solid transparent',
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{color:'rgba(255,255,255,0.75)'}}>{c.title}</p>
                  <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.3)'}}>{c.date}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(c.id) }}
                  aria-label="Usuń rozmowę"
                  className="flex-shrink-0 flex items-center justify-center rounded-md transition-opacity"
                  style={{
                    width: 22, height: 22,
                    opacity: hovered === c.id ? 1 : 0,
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>

        <div style={{padding:'10px 8px',borderTop:'0.5px solid rgba(255,255,255,0.06)'}}>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors"
            style={{color:'rgba(255,255,255,0.4)',border:'0.5px solid rgba(255,255,255,0.08)'}}
          >
            ← Wyloguj
          </button>
          <div className="flex flex-col items-center gap-0.5 mt-3 mb-1">
            <div className="flex items-center gap-1" style={{fontSize:11}}>
              <span style={{color:'rgba(255,255,255,0.35)'}}>crafted by</span>
              <span
                style={{
                  fontWeight:700,letterSpacing:'-0.01em',
                  background:'linear-gradient(135deg,#a78bfa,#60a5fa)',
                  WebkitBackgroundClip:'text',backgroundClip:'text',WebkitTextFillColor:'transparent',
                }}
              >
                NullPointer Studio
              </span>
            </div>
            <span style={{fontSize:9,color:'rgba(255,255,255,0.22)',letterSpacing:'0.04em'}}>
              null safe, fully unchained
            </span>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
