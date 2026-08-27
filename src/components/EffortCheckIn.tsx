import { useState } from 'react'
import type { Effort, Exercise, ExerciseLog } from '../types'
import { adviceForRating } from '../lib/coach'

const OPTIONS: { rating: Effort; label: string }[] = [
  { rating: 'easy', label: 'Too easy' },
  { rating: 'normal', label: 'Just right' },
  { rating: 'hard', label: 'Too hard' },
]

/**
 * Shown once all sets of a lift are done: rate how it felt, and get an
 * immediate, specific suggestion for next time. The rating is remembered so the
 * next session opens with a weight recommendation.
 */
export function EffortCheckIn({
  exercise,
  liveLog,
  initial,
  onRate,
}: {
  exercise: Exercise
  liveLog: ExerciseLog | null
  initial?: Effort
  onRate: (rating: Effort) => void
}) {
  const [selected, setSelected] = useState<Effort | undefined>(initial)
  const advice = selected ? adviceForRating(exercise, selected, liveLog) : null
  const toneClass =
    advice?.tone === 'down' ? 'text-clay-600' : 'text-ink-soft'

  return (
    <div className="mt-6 rounded-3xl bg-cream-50 p-4 shadow-card ring-1 ring-ink-line/70">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-600">
        How did that feel?
      </p>
      <p className="mt-1 text-xs text-ink-faint">
        Tunes your weight suggestion for next time.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => {
          const on = selected === o.rating
          return (
            <button
              key={o.rating}
              onClick={() => {
                setSelected(o.rating)
                onRate(o.rating)
              }}
              aria-pressed={on}
              className={`rounded-full px-2 py-2.5 text-xs font-medium tracking-wide transition active:scale-95 ${
                on
                  ? 'bg-accent-500 text-white shadow-soft'
                  : 'bg-cream-200 text-ink-soft'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      {advice && (
        <p className={`mt-3 text-sm leading-relaxed ${toneClass}`}>
          {advice.text}
        </p>
      )}
    </div>
  )
}
