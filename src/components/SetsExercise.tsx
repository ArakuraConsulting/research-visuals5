import { useState } from 'react'
import type { Exercise } from '../types'
import { primeAudio } from '../lib/feedback'
import { RestTimer } from './RestTimer'
import { PrimaryButton } from './ui'

const DEFAULT_REST_SECONDS = 90

/**
 * A set-based lift: do your reps at your own pace, tap to log each set, and a
 * prominent rest countdown (with an audible 3·2·1 and a bell) tells you when
 * it's time for the next set. Reps are self-paced — only the rest is timed.
 * (Weight logging is handled separately by <WeightLog />.)
 */
export function SetsExercise({
  exercise,
  completedSets,
  onSetsChange,
}: {
  exercise: Exercise
  completedSets: number
  onSetsChange: (completedSets: number) => void
}) {
  const totalSets = Math.max(1, exercise.sets ?? 1)
  const restSeconds = exercise.restSeconds ?? DEFAULT_REST_SECONDS
  // Bump on each rest so the countdown remounts fresh; null = not resting.
  const [restKey, setRestKey] = useState<number | null>(null)

  const allDone = completedSets >= totalSets

  const startRest = (justCompleted: number) => {
    if (justCompleted < totalSets) setRestKey((k) => (k ?? 0) + 1)
    else setRestKey(null)
  }

  const fillNext = () => {
    if (completedSets >= totalSets) return
    primeAudio() // unlock audio (iOS) from this tap so the rest bell will sound
    const next = completedSets + 1
    onSetsChange(next)
    startRest(next)
  }

  const toggleCircle = (index: number) => {
    // index is 0-based. Filled circles are those with index < completedSets.
    if (index < completedSets) {
      // Un-fill this one (and any after it) — mis-tap recovery.
      onSetsChange(index)
      setRestKey(null)
    } else if (index === completedSets) {
      fillNext()
    }
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
        {completedSets} of {totalSets} sets
        {exercise.repRange ? ` · ${exercise.repRange}` : ''}
      </p>
      <p className="mt-1 max-w-xs text-center text-xs leading-relaxed text-ink-faint">
        Reps are self-paced — do your{' '}
        {exercise.repRange ? `${exercise.repRange} reps` : 'reps'}, then tap the
        set. The clock that follows is your rest before the next one.
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
                  : 'border-2 border-ink-line text-ink-faint'
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

      {/* Rest countdown — audible, never auto-advances */}
      {restKey !== null && !allDone && (
        <RestTimer
          key={restKey}
          seconds={restSeconds}
          nextLabel={`set ${completedSets + 1} of ${totalSets}`}
          tips={exercise.restTips}
          onSkip={() => setRestKey(null)}
        />
      )}

      <div className="mt-6 w-full">
        <PrimaryButton onClick={fillNext} disabled={allDone}>
          {allDone ? 'All sets complete' : 'Complete set'}
        </PrimaryButton>
      </div>
    </div>
  )
}
