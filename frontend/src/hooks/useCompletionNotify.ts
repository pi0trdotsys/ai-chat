import { useEffect, useRef } from 'react'
import { playBeep } from '@/lib/notify'

// Gdy odpowiedź kończy się, a użytkownik jest na innej karcie:
// dźwięk + migający tytuł + (jeśli pozwoli) powiadomienie systemowe.
export function useCompletionNotify(isStreaming: boolean) {
  const prev = useRef(isStreaming)
  const flashRef = useRef<number | null>(null)
  const baseTitle = useRef<string>('AI Chat')

  // Zatrzymaj miganie po powrocie na kartę (montowane raz)
  useEffect(() => {
    baseTitle.current = document.title
    const stop = () => {
      if (flashRef.current) {
        clearInterval(flashRef.current)
        flashRef.current = null
        document.title = baseTitle.current
      }
    }
    const onVisible = () => { if (!document.hidden) stop() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      stop()
    }
  }, [])

  useEffect(() => {
    const was = prev.current
    prev.current = isStreaming
    if (was && !isStreaming && document.hidden) {
      playBeep()
      if (!flashRef.current) {
        let on = false
        flashRef.current = window.setInterval(() => {
          document.title = on ? baseTitle.current : '✅ Odpowiedź gotowa!'
          on = !on
        }, 1000)
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('✅ Odpowiedź gotowa', { body: 'Model skończył odpowiadać.' })
        } catch {
          // ignorujemy
        }
      }
    }
  }, [isStreaming])
}
