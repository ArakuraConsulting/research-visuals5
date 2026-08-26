import { useState } from 'react'
import type { Effort, Exercise, ExerciseLog } from '../types'
import { adviceForRating } from '../lib/coach'

const OPTIONS: { rating: Effort; emoji: string; label: string }[] = [
  { rating: 'easy', emoji: '😌', label: 'Too easy' },
  { rating: 'normal', emoji: '💪', label: 'Just right' },
  { rating: 'hard', emoji: '😣', label: 'Too hard' },
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
    advice?.tone === 'up'
      ? 'text-emerald-700'
      : advice?.tone === 'down'
        ? 'text-amber-700'
        : 'text-accent-600'

  return (
    <div className="mt-6 rounded-3xl bg-white p-4 shadow-card ring-1 ring-ink-line/60">
      <p className="text-sm font-bold text-ink">
        All sets done — how did that feel?
      </p>
      <p className="mt-0.5 text-xs text-ink-faint">
        This tunes your weight suggestion for next time.
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
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-xs font-bold transition active:scale-95 ${
                on
                  ? 'bg-accent-500 text-white shadow-soft'
                  : 'bg-cream-200 text-ink-soft'
              }`}
            >
              <span className="text-xl" aria-hidden="true">
                {o.emoji}
              </span>
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
