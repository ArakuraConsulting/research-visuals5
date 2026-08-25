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

export function beep(durationMs = 180, frequency = 880, peak = 0.3): void {
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
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + durationMs / 1000 + 0.02)
  } catch {
    /* ignore */
  }
}

/**
 * A clear, loud bell — a struck-metal "ding" built from a fundamental plus two
 * bright inharmonic partials with a long exponential tail. Meant to be heard
 * across a room while you're mid-exercise and not looking at the screen.
 */
export function ding(): void {
  const ctx = getCtx()
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const now = ctx.currentTime
    // [frequency, peak gain] — fundamental A5 plus shimmering upper partials.
    const partials: Array<[number, number]> = [
      [880, 0.6],
      [1760, 0.28],
      [2640, 0.14],
    ]
    for (const [freq, peak] of partials) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.006)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 1.25)
    }
  } catch {
    /* ignore */
  }
}

/** Short, soft blip for the final "3… 2… 1…" seconds before a round ends. */
export function countdownTick(): void {
  beep(80, 660, 0.22)
}

/** A clear bell when a round or exercise completes. */
export function beepComplete(): void {
  ding()
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
