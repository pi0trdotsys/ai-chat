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
}

export function ModelPicker({ health, models, value, defaultModel, onChange }: ModelPickerProps) {
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
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs rounded-full px-3 py-1.5 transition-colors"
        style={{background:'rgba(167,139,250,0.1)',border:'0.5px solid rgba(167,139,250,0.22)',color:'rgba(255,255,255,0.85)'}}
      >
        <motion.span
          animate={health.status === 'checking' ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
          transition={{ duration: 1.2, repeat: health.status === 'checking' ? Infinity : 0 }}
          style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:statusColor,boxShadow:`0 0 6px ${statusColor}`}}
        />
        <span style={{fontWeight:500}}>{currentLabel}</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{opacity:0.5}}
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-40 left-1/2 -translate-x-1/2 mt-2 rounded-2xl overflow-hidden"
            style={{
              width: 320, maxWidth: '90vw', maxHeight: '70vh', overflowY: 'auto',
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
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => { onChange(m.name); setOpen(false) }}
                    className="text-left rounded-xl px-3 py-2.5 transition-colors"
                    style={{
                      background: active ? 'rgba(167,139,250,0.16)' : 'transparent',
                      border: active ? '0.5px solid rgba(167,139,250,0.3)' : '0.5px solid transparent',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium" style={{color:'rgba(255,255,255,0.92)'}}>
                        {meta.label}
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
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
