/**
 * Audible cues (Web Audio API) and haptic buzz (Vibration API).
 * Both degrade silently when unsupported or blocked.
 *
 * The hard part is iOS: it suspends the AudioContext whenever the screen sleeps
 * or the app is backgrounded — which is exactly when a rest timer is counting
 * down and you've put the phone down. So every cue resumes the context first
 * and, if it was asleep, schedules the sound *after* the resume resolves rather
 * than firing into a suspended context (which is silent). We also re-arm on the
 * page becoming visible again.
 */

let audioCtx: AudioContext | null = null
let listenersBound = false

function getCtx(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null
    if (!audioCtx) audioCtx = new Ctor()
    bindResumeListeners()
    return audioCtx
  } catch {
    return null
  }
}

/** Keep the context alive across screen sleeps / tab switches. */
function bindResumeListeners() {
  if (listenersBound || typeof document === 'undefined') return
  listenersBound = true
  const resume = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
  }
  document.addEventListener('visibilitychange', resume)
  window.addEventListener('focus', resume)
  window.addEventListener('pageshow', resume)
}

/**
 * Play a sound. `schedule(ctx, at)` builds the nodes starting at time `at`.
 * If the context is suspended (iOS after a screen sleep), we resume first and
 * schedule once it's actually running, so the cue is never fired into silence.
 */
function play(schedule: (ctx: AudioContext, at: number) => void): void {
  const ctx = getCtx()
  if (!ctx) return
  const run = () => {
    try {
      schedule(ctx, ctx.currentTime + 0.02)
    } catch {
      /* ignore */
    }
  }
  if (ctx.state === 'running') {
    run()
  } else {
    // Resume, then play. Also attempt immediately in case resume is instant.
    ctx.resume().then(run).catch(() => {})
  }
}

/**
 * Prime the audio context from a user gesture (e.g. the Start button, or
 * opening a workout). iOS requires a gesture before any sound will play, so we
 * resume and push a one-sample silent buffer through to fully unlock output.
 */
export function primeAudio(): void {
  const ctx = getCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  try {
    const buffer = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)
    src.start(0)
  } catch {
    /* ignore */
  }
}

function tone(
  ctx: AudioContext,
  at: number,
  frequency: number,
  peak: number,
  durationS: number,
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + durationS)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(at)
  osc.stop(at + durationS + 0.02)
}

export function beep(durationMs = 180, frequency = 880, peak = 0.3): void {
  play((ctx, at) => tone(ctx, at, frequency, peak, durationMs / 1000))
}

/**
 * A clear, loud bell — a struck-metal "ding" built from a fundamental plus two
 * bright inharmonic partials with a long exponential tail. Meant to be heard
 * across a room while you're mid-exercise and not looking at the screen.
 */
export function ding(): void {
  play((ctx, at) => {
    const partials: Array<[number, number]> = [
      [880, 0.6],
      [1760, 0.28],
      [2640, 0.14],
    ]
    for (const [freq, peak] of partials) tone(ctx, at, freq, peak, 1.15)
  })
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
