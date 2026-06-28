import { motion } from 'framer-motion'

// Autorska animacja "odpowiedź w toku" - gradientowe słupki falujące jak equalizer,
// w kolorach marki. Spójne z resztą interfejsu, nie generyczne 3 kropki.
export function ThinkingBars({ height = 15 }: { height?: number }) {
  const bars = [0, 1, 2, 3, 4]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2.5, height }}>
      {bars.map(i => (
        <motion.span
          key={i}
          animate={{ scaleY: [0.35, 1, 0.35], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.95,
            repeat: Infinity,
            delay: i * 0.11,
            ease: 'easeInOut',
          }}
          style={{
            width: 3,
            height,
            borderRadius: 3,
            transformOrigin: 'center',
            background: 'linear-gradient(180deg,#a78bfa,#60a5fa)',
          }}
        />
      ))}
    </span>
  )
}
