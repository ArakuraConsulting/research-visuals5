import { useState } from 'react'
import type { Exercise } from '../types'
import { formatClock } from '../lib/time'
import { useInterval } from '../lib/useInterval'
import { PrimaryButton } from './ui'

const REST_SECONDS = 90

/**
 * A set-based exercise: one circle per set, no target duration. Completing a
 * set offers an optional 90s rest countdown that never auto-advances. A free
 * text weight field is saved into history.
 */
export function SetsExercise({
  exercise,
  completedSets,
  weight,
  onChange,
}: {
  exercise: Exercise
  completedSets: number
  weight: string
  onChange: (next: { completedSets: number; weight: string }) => void
}) {
  const totalSets = Math.max(1, exercise.sets ?? 1)
  const [restRemaining, setRestRemaining] = useState<number | null>(null)

  const allDone = completedSets >= totalSets

  useInterval(
    () => {
      setRestRemaining((r) => {
        if (r === null) return null
        if (r <= 1) return null // rest elapsed — just stop, never advance
        return r - 1
      })
    },
    restRemaining !== null ? 1000 : null,
  )

  const fillNext = () => {
    if (completedSets >= totalSets) return
    onChange({ completedSets: completedSets + 1, weight })
    setRestRemaining(REST_SECONDS)
  }

  const toggleCircle = (index: number) => {
    // index is 0-based. Filled circles are those with index < completedSets.
    if (index < completedSets) {
      // Un-fill this one (and any after it) — mis-tap recovery.
      onChange({ completedSets: index, weight })
      setRestRemaining(null)
    } else if (index === completedSets) {
      fillNext()
    }
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-white/50">
        {completedSets} of {totalSets} sets
        {exercise.repRange ? ` · ${exercise.repRange}` : ''}
      </p>

      {/* Circles */}
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {Array.from({ length: totalSets }).map((_, i) => {
          const filled = i < completedSets
          return (
            <button
              key={i}
              onClick={() => toggleCircle(i)}
              aria-label={filled ? `Set ${i + 1}, completed` : `Set ${i + 1}`}
              className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold transition active:scale-95 ${
                filled
                  ? 'bg-accent-500 text-white shadow-soft'
                  : 'border-2 border-white/25 text-white/40'
              }`}
            >
              {filled ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                i + 1
              )}
            </button>
          )
        })}
      </div>

      {/* Rest countdown (optional, never auto-advances) */}
      {restRemaining !== null && (
        <div className="mt-6 flex w-full items-center justify-between rounded-2xl bg-amber-500/15 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/80">
              Rest
            </p>
            <p className="font-mono text-2xl font-bold tabular-nums text-amber-300">
              {formatClock(restRemaining)}
            </p>
          </div>
          <button
            onClick={() => setRestRemaining(null)}
            className="rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-200 active:scale-95"
          >
            Skip rest
          </button>
        </div>
      )}

      <div className="mt-6 w-full">
        <PrimaryButton onClick={fillNext} disabled={allDone}>
          {allDone ? 'All sets complete' : 'Complete set'}
        </PrimaryButton>
      </div>

      {/* Weight field */}
      <div className="mt-5 w-full">
        <label
          htmlFor={`weight-${exercise.id}`}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50"
        >
          Weight used
        </label>
        <input
          id={`weight-${exercise.id}`}
          type="text"
          inputMode="text"
          value={weight}
          onChange={(e) => onChange({ completedSets, weight: e.target.value })}
          placeholder="e.g. 12.5 kg dumbbells"
          className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:border-accent-400 focus:outline-none"
        />
      </div>
    </div>
  )
}
