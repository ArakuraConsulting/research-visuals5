import { useMemo, useState } from 'react'
import type { Exercise } from '../types'
import { formatClock } from '../lib/time'
import { useInterval } from '../lib/useInterval'
import { beepComplete, vibrate } from '../lib/feedback'
import { PrimaryButton, SecondaryButton } from './ui'

const REST_BETWEEN_ROUNDS = 10 // seconds

type Phase = 'idle' | 'work' | 'rest' | 'done'

/**
 * A single timed exercise: countdown per round, start/pause/reset, an audible
 * beep + haptic buzz on round completion, and an auto-advancing 10s rest
 * between rounds. Calls onComplete once when the final round finishes.
 */
export function TimedExercise({
  exercise,
  onComplete,
  onSkip,
}: {
  exercise: Exercise
  onComplete: () => void
  onSkip: () => void
}) {
  const duration = exercise.durationSeconds ?? 0
  const totalRounds = Math.max(1, exercise.rounds ?? 1)

  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState<Phase>('idle')
  const [remaining, setRemaining] = useState(duration)
  const [running, setRunning] = useState(false)

  const isRest = phase === 'rest'
  const isDone = phase === 'done'

  const tick = () => {
    setRemaining((r) => {
      if (r > 1) return r - 1
      // Reached zero — resolve the current phase.
      if (isRest) {
        // Rest finished: begin the next round's work.
        setRound((cur) => cur + 1)
        setPhase('work')
        return duration
      }
      // A work round just finished.
      beepComplete()
      vibrate([120, 60, 120])
      if (round < totalRounds) {
        setPhase('rest')
        return REST_BETWEEN_ROUNDS
      }
      // Last round done.
      setPhase('done')
      setRunning(false)
      onComplete()
      return 0
    })
  }

  useInterval(tick, running && !isDone ? 1000 : null)

  const start = () => {
    if (isDone) return
    if (phase === 'idle') setPhase('work')
    setRunning(true)
  }
  const pause = () => setRunning(false)
  const reset = () => {
    setRunning(false)
    setRound(1)
    setPhase('idle')
    setRemaining(duration)
  }

  const label = useMemo(() => {
    if (isDone) return 'Done'
    if (isRest) return `Rest — round ${round + 1} of ${totalRounds} next`
    if (totalRounds > 1) return `Round ${round} of ${totalRounds}`
    return running ? 'Working' : 'Ready'
  }, [isDone, isRest, round, totalRounds, running])

  const ringColor = isRest
    ? 'text-amber-400'
    : isDone
      ? 'text-emerald-400'
      : 'text-accent-400'

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-white/50">
        {label}
      </p>

      <div
        className={`mt-3 font-mono text-7xl font-extrabold tabular-nums ${ringColor}`}
        aria-live="polite"
      >
        {formatClock(remaining)}
      </div>

      {totalRounds > 1 && (
        <div className="mt-4 flex gap-2" aria-hidden="true">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${
                i + 1 < round || isDone
                  ? 'bg-emerald-400'
                  : i + 1 === round && !isDone
                    ? 'bg-accent-400'
                    : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      )}

      <div className="mt-8 w-full space-y-3">
        {!isDone ? (
          <div className="flex gap-3">
            {!running ? (
              <PrimaryButton onClick={start} className="flex-1">
                {phase === 'idle' ? 'Start' : 'Resume'}
              </PrimaryButton>
            ) : (
              <PrimaryButton
                onClick={pause}
                className="flex-1 !bg-amber-500"
              >
                Pause
              </PrimaryButton>
            )}
            <SecondaryButton onClick={reset} className="px-6">
              Reset
            </SecondaryButton>
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-500/15 px-4 py-3 text-center text-sm font-semibold text-emerald-300">
            All rounds complete — tap Next to continue
          </div>
        )}

        <button
          onClick={onSkip}
          className="w-full py-2 text-sm font-semibold text-white/50 active:text-white"
        >
          Skip this exercise
        </button>
      </div>
    </div>
  )
}
