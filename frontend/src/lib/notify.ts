// Krótki, przyjemny „ding" przez WebAudio - bez plików dźwiękowych
let audioCtx: AudioContext | null = null

export function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = audioCtx || new Ctx()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const now = audioCtx.currentTime

    const tone = (freq: number, start: number, dur: number, peak: number) => {
      const o = audioCtx!.createOscillator()
      const g = audioCtx!.createGain()
      o.connect(g)
      g.connect(audioCtx!.destination)
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, now + start)
      g.gain.exponentialRampToValueAtTime(peak, now + start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
      o.start(now + start)
      o.stop(now + start + dur + 0.02)
    }

    tone(880, 0, 0.35, 0.15) // A5
    tone(1320, 0.12, 0.4, 0.12) // E6 - drugie, wyższe
  } catch {
    // brak WebAudio / brak gestu - po prostu pomijamy dźwięk
  }
}
