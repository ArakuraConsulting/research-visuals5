import { useEffect } from 'react'
import type { SessionStats } from '../types'
import { formatClock } from '../lib/time'
import { PATTERN_ORDER } from '../lib/achievements'
import { beepComplete, vibrate } from '../lib/feedback'
import { PrimaryButton } from './ui'

export function CompletionScreen({
  workoutName,
  elapsedSeconds,
  completedCount,
  totalCount,
  stats,
  highlights,
  onDone,
}: {
  workoutName: string
  elapsedSeconds: number
  completedCount: number
  totalCount: number
  stats?: SessionStats
  highlights?: string[]
  onDone: () => void
}) {
  useEffect(() => {
    beepComplete()
    vibrate([200, 80, 200])
  }, [])

  const allDone = completedCount >= totalCount
  const patterns = stats
    ? PATTERN_ORDER.filter((p) => (stats.byPattern[p] ?? 0) > 0)
    : []
  const movedKg = stats?.totalKg ?? 0

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center px-6 py-14 text-center safe-top safe-bottom">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-tint">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent-600"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
        {allDone ? 'Workout done' : 'Progress saved'}
      </h1>
      <p className="mt-1 text-ink-soft">{workoutName}</p>
      {!allDone && (
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-faint">
          Your ticks are saved. Reopen this workout any time today to finish the
          rest — it’ll pick up right where you left off.
        </p>
      )}

      <div className="mt-7 grid w-full grid-cols-3 gap-3">
        <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-ink-line/60">
          <p className="font-mono text-2xl font-bold tabular-nums text-accent-600">
            {formatClock(elapsedSeconds)}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Time
          </p>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-ink-line/60">
          <p className="text-2xl font-bold text-accent-600">
            {completedCount}
            <span className="text-base text-ink-faint">/{totalCount}</span>
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Exercises
          </p>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-ink-line/60">
          <p className="text-2xl font-bold text-accent-600 tabular-nums">
            {movedKg > 0 ? movedKg : '—'}
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            {movedKg > 0 ? 'kg moved' : 'Bodyweight'}
          </p>
        </div>
      </div>

      {patterns.length > 0 && (
        <div className="mt-4 w-full rounded-3xl bg-cream-50 p-4 text-left shadow-card ring-1 ring-ink-line/60">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Weight moved{movedKg > 0 ? ` — about ${movedKg} kg total` : ''}
          </p>
          <div className="mt-2.5 space-y-2">
            {patterns.map((p) => (
              <div key={p} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink">{p}</span>
                <span className="text-sm font-semibold tabular-nums text-accent-600">
                  {stats!.byPattern[p]} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {highlights && highlights.length > 0 && (
        <div className="mt-4 w-full rounded-3xl bg-accent-tint p-4 text-left ring-1 ring-inset ring-accent-500/15">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-600">
            New best {highlights.length > 1 ? 'lifts' : 'lift'}
          </p>
          <ul className="mt-2 space-y-1.5">
            {highlights.map((h, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-relaxed text-ink-soft"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 w-full">
        <PrimaryButton onClick={onDone}>
          {allDone ? 'Save & finish' : 'Save & back to workouts'}
        </PrimaryButton>
      </div>
    </div>
  )
}
