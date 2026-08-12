/**
 * An original, upbeat backing groove synthesized with the Web Audio API — kick,
 * hats, clap, a bassline and a bright plucky melody over a I–V–vi–IV loop.
 * No audio files, no licensing, works offline. Kept at a low background level.
 *
 * Everything degrades silently if Web Audio is unavailable.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null
let timer: number | null = null
let playing = false
let step = 0
let nextNoteTime = 0

const TEMPO = 124
const SIXTEENTH = 60 / TEMPO / 4
const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD = 0.12

// Note frequencies (equal temperament).
const NOTE: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
}

// I–V–vi–IV in C: C major, G major, A minor, F major. One chord per bar (16 steps).
const CHORDS = [
  { bass: 'C2', notes: ['C4', 'E4', 'G4', 'C5'] },
  { bass: 'G2', notes: ['G3', 'B3', 'D4', 'G4'] },
  { bass: 'A2', notes: ['A3', 'C4', 'E4', 'A4'] },
  { bass: 'F2', notes: ['F3', 'A3', 'C4', 'F4'] },
]

function getCtx(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null
    if (!ctx) {
      ctx = new Ctor()
      master = ctx.createGain()
      master.gain.value = 0.0
      master.connect(ctx.destination)
      // Pre-render a short white-noise buffer for hats/clap.
      const len = Math.floor(ctx.sampleRate * 0.5)
      noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    }
    return ctx
  } catch {
    return null
  }
}

function env(g: GainNode, t: number, peak: number, attack: number, release: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release)
}

function kick(t: number) {
  if (!ctx || !master) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(150, t)
  o.frequency.exponentialRampToValueAtTime(50, t + 0.12)
  env(g, t, 0.9, 0.005, 0.13)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + 0.2)
}

function noiseHit(t: number, freq: number, type: BiquadFilterType, peak: number, release: number) {
  if (!ctx || !master || !noiseBuffer) return
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  const filt = ctx.createBiquadFilter()
  filt.type = type
  filt.frequency.value = freq
  const g = ctx.createGain()
  env(g, t, peak, 0.003, release)
  src.connect(filt).connect(g).connect(master)
  src.start(t)
  src.stop(t + release + 0.02)
}

function tone(t: number, freq: number, type: OscillatorType, peak: number, dur: number, cutoff: number) {
  if (!ctx || !master) return
  const o = ctx.createOscillator()
  const filt = ctx.createBiquadFilter()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  filt.type = 'lowpass'
  filt.frequency.value = cutoff
  env(g, t, peak, 0.006, dur)
  o.connect(filt).connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function scheduleStep(s: number, t: number) {
  const inBar = s % 16
  const bar = Math.floor(s / 16) % 4
  const chord = CHORDS[bar]

  // Drums
  if (inBar % 4 === 0) kick(t) // four on the floor
  if (inBar === 4 || inBar === 12) noiseHit(t, 1600, 'bandpass', 0.35, 0.12) // clap
  if (inBar % 2 === 0) noiseHit(t, 8000, 'highpass', 0.12, 0.03) // closed hat

  // Bass on every beat
  if (inBar % 4 === 0) tone(t, NOTE[chord.bass], 'sawtooth', 0.28, 0.22, 600)

  // Bright plucky melody on the eighths, cycling the chord tones
  if (inBar % 2 === 0) {
    const note = chord.notes[(inBar / 2) % chord.notes.length]
    tone(t, NOTE[note], 'triangle', 0.14, 0.18, 2600)
  }
}

function scheduler() {
  if (!ctx) return
  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(step, nextNoteTime)
    nextNoteTime += SIXTEENTH
    step = (step + 1) % 64
  }
}

export function startMusic(): boolean {
  const c = getCtx()
  if (!c || !master) return false
  if (playing) return true
  if (c.state === 'suspended') c.resume().catch(() => {})
  playing = true
  step = 0
  nextNoteTime = c.currentTime + 0.06
  master.gain.cancelScheduledValues(c.currentTime)
  master.gain.setValueAtTime(0.0001, c.currentTime)
  master.gain.exponentialRampToValueAtTime(0.22, c.currentTime + 0.4)
  timer = window.setInterval(scheduler, LOOKAHEAD_MS)
  return true
}

export function stopMusic(): void {
  if (!ctx || !master) {
    playing = false
    return
  }
  if (timer !== null) {
    window.clearInterval(timer)
    timer = null
  }
  const now = ctx.currentTime
  master.gain.cancelScheduledValues(now)
  master.gain.setValueAtTime(master.gain.value, now)
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
  playing = false
}

export function isMusicPlaying(): boolean {
  return playing
}
