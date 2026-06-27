import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { describeModel, type ModelEntry } from '@/lib/models'
import type { Health } from '@/hooks/useHealth'

interface ModelPickerProps {
  health: Health
  models: ModelEntry[]
  value: string // '' = model domyślny backendu
  defaultModel: string
  onChange: (name: string) => void
  hint?: boolean
  onDismissHint?: () => void
}

export function ModelPicker({ health, models, value, defaultModel, onChange, hint, onDismissHint }: ModelPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const toggle = () => {
    setOpen(o => !o)
    onDismissHint?.()
  }

  const current = value || defaultModel
  const currentLabel = describeModel(current).label

  const statusColor =
    health.status === 'checking' ? '#9ca3af'
    : health.ollama === 'down' ? '#ef4444'
    : !health.modelLoaded ? '#f59e0b'
    : '#22c55e'

  return (
    <div ref={ref} style={{position:'relative'}}>
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 text-xs rounded-full pl-3 pr-2.5 py-1.5 transition-colors"
        style={{background:'rgba(167,139,250,0.1)',border:'0.5px solid rgba(167,139,250,0.22)',color:'rgba(255,255,255,0.85)'}}
      >
        <motion.span
          animate={health.status === 'checking' ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
          transition={{ duration: 1.2, repeat: health.status === 'checking' ? Infinity : 0 }}
          style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:statusColor,boxShadow:`0 0 6px ${statusColor}`}}
        />
        <span style={{fontWeight:500}}>{currentLabel}</span>
        <span style={{color:'rgba(255,255,255,0.4)',fontSize:11}}>· zmień</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{opacity:0.5}}
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {hint && !open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: [0, 3, 0] }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ opacity: { duration: 0.3 }, y: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } }}
            className="absolute z-40 left-0 mt-2 rounded-lg px-2.5 py-1.5 whitespace-nowrap"
            style={{
              top: '100%',
              background:'linear-gradient(135deg,rgba(167,139,250,0.95),rgba(96,165,250,0.95))',
              boxShadow:'0 6px 20px rgba(120,80,255,0.35)',
              fontSize:11,fontWeight:500,color:'#fff',
            }}
          >
            ↑ Kliknij, aby wybrać model AI
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-40 left-0 mt-2 rounded-2xl overflow-hidden"
            style={{
              top: '100%',
              width: 320, maxWidth: 'min(320px, calc(100vw - 32px))', maxHeight: '70vh', overflowY: 'auto',
              background: 'rgba(30,27,55,0.92)', backdropFilter: 'blur(24px)',
              border: '0.5px solid rgba(167,139,250,0.25)', boxShadow: '0 16px 50px rgba(0,0,0,0.45)',
            }}
          >
            <div className="px-3 py-2" style={{borderBottom:'0.5px solid rgba(255,255,255,0.08)'}}>
              <p className="text-xs font-semibold" style={{color:'rgba(255,255,255,0.85)'}}>Wybierz model</p>
              <p style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>Każdy nadaje się do czegoś innego</p>
            </div>
            <div className="p-1.5 flex flex-col gap-1">
              {models.length === 0 && (
                <p className="text-xs text-center py-4" style={{color:'rgba(255,255,255,0.35)'}}>
                  Brak dostępnych modeli
                </p>
              )}
              {models.map(m => {
                const meta = describeModel(m.name)
                const active = m.name === current
                return (
                  <motion.button
                    key={m.name}
                    type="button"
                    onClick={() => { onChange(m.name); setOpen(false) }}
                    whileHover={{ scale: 1.015, backgroundColor: 'rgba(167,139,250,0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    className="text-left rounded-xl px-3 py-2.5"
                    style={{
                      background: active ? 'rgba(167,139,250,0.16)' : 'transparent',
                      border: active ? '0.5px solid rgba(167,139,250,0.3)' : '0.5px solid transparent',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-medium" style={{color:'rgba(255,255,255,0.92)'}}>
                        <span>{meta.emoji}</span>
                        {meta.label}
                        {active && (
                          <motion.span
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                            style={{color:'#86efac',fontSize:12}}
                          >
                            ✓
                          </motion.span>
                        )}
                      </span>
                      <span style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>
                        {m.sizeMB >= 1000 ? `${(m.sizeMB / 1000).toFixed(1)} GB` : `${m.sizeMB} MB`}
                      </span>
                    </div>
                    {meta.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {meta.tags.map(t => (
                          <span
                            key={t}
                            style={{
                              fontSize:9,letterSpacing:'0.02em',padding:'1px 6px',borderRadius:99,
                              background:'rgba(96,165,250,0.14)',border:'0.5px solid rgba(96,165,250,0.25)',
                              color:'rgba(147,197,253,0.9)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-1.5 leading-snug" style={{fontSize:11,color:'rgba(255,255,255,0.55)'}}>
                      {meta.desc}
                    </p>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
