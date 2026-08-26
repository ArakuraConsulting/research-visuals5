import { useEffect, useRef, useState } from 'react'
import { formatClock } from '../lib/time'
import { useInterval } from '../lib/useInterval'
import { countdownTick, ding, vibrate } from '../lib/feedback'

const DEFAULT_TIPS = [
  'Shake out the working muscles and breathe slowly.',
  'Sip some water.',
  'Stay loose — a slow walk or gentle stretch beats sitting still.',
]

/**
 * A prominent rest countdown between sets: a big clock, an audible 3·2·1 and a
 * bell when it's time for the next set, plus what to do while you wait. Never
 * auto-starts the next set — it just tells you when the rest is up.
 */
export function RestTimer({
  seconds,
  nextLabel,
  tips,
  onSkip,
}: {
  seconds: number
  /** e.g. "set 2 of 3" — what comes after this rest. */
  nextLabel?: string
  tips?: string[]
  onSkip: () => void
}) {
  const [remaining, setRemaining] = useState(seconds)
  const prev = useRef(seconds)
  const done = remaining <= 0

  useInterval(() => setRemaining((r) => Math.max(0, r - 1)), done ? null : 1000)

  // Side effects (sound + haptics) live here, not in the tick updater, so they
  // fire exactly once per second even under React's strict double-invoke.
  useEffect(() => {
    if (remaining > 0 && remaining <= 3) countdownTick()
    if (remaining === 0 && prev.current > 0) {
      ding()
      vibrate([120, 60, 120])
    }
    prev.current = remaining
  }, [remaining])

  const shownTips = tips && tips.length > 0 ? tips : DEFAULT_TIPS

  return (
    <div
      className={`mt-6 w-full rounded-3xl p-5 ${
        done ? 'bg-emerald-500/15' : 'bg-amber-500/10'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-xs font-bold uppercase tracking-wide ${
              done ? 'text-emerald-300/80' : 'text-amber-300/80'
            }`}
          >
            {done ? 'Rest done' : 'Rest'}
          </p>
          <p
            className={`font-mono text-4xl font-extrabold tabular-nums ${
              done ? 'text-emerald-300' : 'text-amber-300'
            }`}
            aria-live="polite"
          >
            {done ? 'Go!' : formatClock(remaining)}
          </p>
          <p className="mt-0.5 text-sm text-white/60">
            {done
              ? `Start your ${nextLabel ?? 'next set'} 💪`
              : `Next: ${nextLabel ?? 'your next set'}`}
          </p>
        </div>
        {!done && (
          <button
            onClick={onSkip}
            className="shrink-0 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 active:scale-95"
          >
            Skip rest
          </button>
        )}
      </div>

      <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3">
        {shownTips.map((tip, i) => (
          <li
            key={i}
            className="flex gap-2 text-sm leading-relaxed text-white/70"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/40" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
