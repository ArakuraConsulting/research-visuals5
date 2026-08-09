/**
 * Audible beep (Web Audio API) and haptic buzz (Vibration API).
 * Both degrade silently when unsupported or blocked.
 */

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null
    if (!audioCtx) audioCtx = new Ctor()
    return audioCtx
  } catch {
    return null
  }
}

/**
 * Prime the audio context from a user gesture (e.g. the Start button).
 * iOS Safari requires this before any programmatic sound will play.
 */
export function primeAudio(): void {
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

export function beep(durationMs = 180, frequency = 880): void {
  const ctx = getCtx()
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    const now = ctx.currentTime
    // Soft attack/decay envelope to avoid clicks.
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + durationMs / 1000 + 0.02)
  } catch {
    /* ignore */
  }
}

/** Two quick beeps, used when a round or exercise completes. */
export function beepComplete(): void {
  beep(150, 880)
  window.setTimeout(() => beep(180, 1174), 170)
}

export function vibrate(pattern: number | number[] = 200): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {
    /* ignore */
  }
}
