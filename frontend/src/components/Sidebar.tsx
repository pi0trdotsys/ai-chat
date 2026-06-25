import { motion, AnimatePresence } from 'framer-motion'

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
  onLogout: () => void
}

export function Sidebar({ isOpen, onClose, conversations, activeId, onSelect, onNew, onLogout }: SidebarProps) {
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
          {conversations.map(c => (
            <button
              key={c.id}
              onClick={() => { onSelect(c.id); onClose() }}
              className="w-full text-left px-3 py-2 rounded-lg transition-colors"
              style={{
                background: activeId === c.id ? 'rgba(167,139,250,0.15)' : 'transparent',
                border: activeId === c.id ? '0.5px solid rgba(167,139,250,0.25)' : '0.5px solid transparent',
              }}
            >
              <p className="text-xs truncate" style={{color:'rgba(255,255,255,0.75)'}}>{c.title}</p>
              <p className="text-xs mt-0.5" style={{color:'rgba(255,255,255,0.3)'}}>{c.date}</p>
            </button>
          ))}
        </div>

        <div style={{padding:'10px 8px',borderTop:'0.5px solid rgba(255,255,255,0.06)'}}>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors"
            style={{color:'rgba(255,255,255,0.4)',border:'0.5px solid rgba(255,255,255,0.08)'}}
          >
            ← Wyloguj
          </button>
        </div>
      </motion.aside>
    </>
  )
}
