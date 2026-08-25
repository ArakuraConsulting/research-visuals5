import { useEffect } from 'react'
import { formatClock } from '../lib/time'
import { beepComplete, vibrate } from '../lib/feedback'
import { PrimaryButton } from './ui'

export function CompletionScreen({
  workoutName,
  elapsedSeconds,
  completedCount,
  totalCount,
  onDone,
}: {
  workoutName: string
  elapsedSeconds: number
  completedCount: number
  totalCount: number
  onDone: () => void
}) {
  useEffect(() => {
    beepComplete()
    vibrate([200, 80, 200])
  }, [])

  const allDone = completedCount >= totalCount

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-6 py-16 text-center safe-top safe-bottom">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-400"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h1 className="mt-6 text-3xl font-extrabold text-white">
        {allDone ? 'Workout done' : 'Progress saved'}
      </h1>
      <p className="mt-1 text-white/60">{workoutName}</p>
      {!allDone && (
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
          Your ticks are saved. Reopen this workout any time today to finish the
          rest — it’ll pick up right where you left off.
        </p>
      )}

      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        <div className="rounded-3xl bg-white/5 p-5">
          <p className="font-mono text-3xl font-bold tabular-nums text-accent-400">
            {formatClock(elapsedSeconds)}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/50">
            Elapsed
          </p>
        </div>
        <div className="rounded-3xl bg-white/5 p-5">
          <p className="text-3xl font-bold text-accent-400">
            {completedCount}
            <span className="text-lg text-white/40">/{totalCount}</span>
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/50">
            Exercises
          </p>
        </div>
      </div>

      <div className="mt-10 w-full">
        <PrimaryButton onClick={onDone}>
          {allDone ? 'Save & finish' : 'Save & back to workouts'}
        </PrimaryButton>
      </div>
    </div>
  )
}
