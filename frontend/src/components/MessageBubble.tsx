import { motion } from 'framer-motion'
import type { Message } from '@/types/chat'
import { Markdown } from './Markdown'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-2 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
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
        {isUser ? 'P' : '🐬'}
      </div>

      <div
        className="max-w-[75%] px-3 py-2 text-sm leading-relaxed"
        style={{
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background: isUser ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)',
          border: isUser ? '0.5px solid rgba(167,139,250,0.3)' : '0.5px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {isStreaming && !message.content ? (
          <span className="flex gap-1 items-center py-0.5">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:'rgba(167,139,250,0.7)'}}
              />
            ))}
          </span>
        ) : isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : isStreaming ? (
          // Podczas generacji render zwykłego tekstu (Markdown re-parsowany co token byłby kosztowny);
          // pełne formatowanie pojawia się po zakończeniu odpowiedzi.
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <>
            <Markdown content={message.content} />
            {message.stats && (
              <div
                className="flex items-center gap-2.5 mt-2 pt-1.5 flex-wrap"
                style={{borderTop:'0.5px solid rgba(255,255,255,0.06)',fontSize:10,color:'rgba(255,255,255,0.4)'}}
              >
                <span title="Ile fragmentów tekstu model wziął pod uwagę (Twoje pytanie i wcześniejsza rozmowa). Fragment to ok. 3-4 znaki.">
                  📖 przeczytał {message.stats.promptTok}
                </span>
                <span title="Ile fragmentów tekstu model napisał w tej odpowiedzi.">
                  ✍️ napisał {message.stats.genTok}
                </span>
                <span title="Jak szybko pisał - fragmentów na sekundę.">
                  ⚡ {message.stats.tps.toString().replace('.', ',')}/s
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
