import type { HistoryEntry, Workout } from '../types'
import { formatDate, formatElapsedShort, workoutTotalLabel } from '../lib/time'

/**
 * A minimal, abstract line-mark per workout (no pictures) — thin sage strokes
 * on a soft tonal tile. Falls back to a simple mark for unknown ids.
 */
function Motif({ id }: { id: string }) {
  const common = {
    width: 30,
    height: 30,
    viewBox: '0 0 40 40',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (id === 'daily-practice') {
    // Calm concentric arcs — a quiet sunrise.
    return (
      <svg {...common}>
        <path d="M6 28h28" />
        <path d="M12 28a8 8 0 0 1 16 0" />
        <path d="M17 28a3 3 0 0 1 6 0" />
      </svg>
    )
  }
  if (id === 'session-a') {
    // Ascending strokes — pull / press upward.
    return (
      <svg {...common}>
        <path d="M9 30l7-9" />
        <path d="M18 30l7-13" />
        <path d="M27 30l4-7" />
      </svg>
    )
  }
  if (id === 'session-b') {
    // A hinge — the fold of a deadlift / bend.
    return (
      <svg {...common}>
        <path d="M8 12v11l9 7 15-9" />
        <circle cx="8" cy="12" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="20" cy="20" r="11" />
      <path d="M12 20h16" />
    </svg>
  )
}

function WorkoutCard({
  workout,
  onOpen,
  progress,
}: {
  workout: Workout
  onOpen: () => void
  progress?: { done: number; total: number }
}) {
  const inProgress = progress && progress.done > 0
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0
  return (
    <button
      onClick={onOpen}
      className="group w-full rounded-3xl bg-cream-50 p-4 text-left shadow-card ring-1 ring-ink-line/70 transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-tint text-accent-600">
          <Motif id={workout.id} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              {workout.name}
            </h2>
            {inProgress && (
              <span className="mt-0.5 shrink-0 text-xs font-semibold tabular-nums text-accent-600">
                {progress!.done}/{progress!.total}
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-faint">
            {workout.description}
          </p>
          <div className="mt-1.5 flex items-center gap-3 text-[12px] font-medium text-ink-faint">
            <span>{workout.exercises.length} exercises</span>
            <span className="text-ink-line">·</span>
            <span>{workout.timed ? workoutTotalLabel(workout) : 'Untimed'}</span>
            <span className="ml-auto font-semibold text-accent-600">
              {inProgress ? 'Continue' : 'Begin'}
            </span>
          </div>
        </div>
      </div>
      {inProgress && (
        <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-cream-200">
          <div
            className="h-full rounded-full bg-accent-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </button>
  )
}

function RecentActivity({ history }: { history: HistoryEntry[] }) {
  const recent = history.slice(0, 5)
  if (recent.length === 0) {
    return (
      <div className="rounded-3xl bg-cream-50 p-5 text-sm text-ink-faint shadow-card ring-1 ring-ink-line/70">
        No sessions yet. Finish a workout and it will show up here.
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-3xl bg-cream-50 shadow-card ring-1 ring-ink-line/70">
      {recent.map((h, i) => (
        <div
          key={h.id}
          className={`flex items-center justify-between px-5 py-3.5 ${
            i > 0 ? 'border-t border-ink-line' : ''
          }`}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {h.workoutName}
            </p>
            <p className="text-xs text-ink-faint">{formatDate(h.dateISO)}</p>
          </div>
          <span className="ml-3 shrink-0 text-sm font-medium tabular-nums text-accent-600">
            {formatElapsedShort(h.elapsedSeconds)}
          </span>
        </div>
      ))}
    </div>
  )
}

function GearIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export function HomeView({
  workouts,
  history,
  progressByWorkout,
  travelMode,
  onToggleTravel,
  onOpenWorkout,
  onOpenHistory,
  onOpenProgress,
  onOpenNotice,
  onOpenSettings,
  onOpenGuide,
}: {
  workouts: Workout[]
  history: HistoryEntry[]
  progressByWorkout: Record<string, { done: number; total: number }>
  travelMode: boolean
  onToggleTravel: (on: boolean) => void
  onOpenWorkout: (id: string) => void
  onOpenHistory: () => void
  onOpenProgress: () => void
  onOpenNotice: () => void
  onOpenSettings: () => void
  onOpenGuide: () => void
}) {
  return (
    <div className="mx-auto min-h-full max-w-md px-5 pb-16 pt-6 safe-top">
      <header className="mb-7 flex items-start justify-between px-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-accent-600">
            Arakura
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            Your practice
          </h1>
        </div>
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-ink-line bg-cream-50 text-ink-soft active:scale-95"
        >
          <GearIcon />
        </button>
      </header>

      {/* Home / Travel mode */}
      <div className="mb-6">
        <div className="flex gap-1 rounded-full bg-cream-200 p-1">
          <button
            onClick={() => onToggleTravel(false)}
            className={`flex-1 rounded-full py-2 text-sm font-medium tracking-wide transition ${
              !travelMode
                ? 'bg-cream-50 text-ink shadow-soft'
                : 'text-ink-faint active:text-ink'
            }`}
          >
            At home
          </button>
          <button
            onClick={() => onToggleTravel(true)}
            className={`flex-1 rounded-full py-2 text-sm font-medium tracking-wide transition ${
              travelMode
                ? 'bg-cream-50 text-ink shadow-soft'
                : 'text-ink-faint active:text-ink'
            }`}
          >
            Travelling
          </button>
        </div>
        <p className="mt-2 px-1 text-xs text-ink-faint">
          {travelMode
            ? 'Bodyweight versions, no equipment needed.'
            : 'Full equipment — weights, bands, mat, bar.'}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          onClick={onOpenProgress}
          className="rounded-2xl bg-accent-tint px-4 py-3 text-sm font-medium text-accent-600 active:scale-[0.98]"
        >
          Progress
        </button>
        <button
          onClick={onOpenHistory}
          className="rounded-2xl border border-ink-line bg-cream-50 px-4 py-3 text-sm font-medium text-ink active:scale-[0.98]"
        >
          History
        </button>
      </div>

      <div className="space-y-3">
        {workouts.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            onOpen={() => onOpenWorkout(w.id)}
            progress={progressByWorkout[w.id]}
          />
        ))}
      </div>

      <section className="mt-9">
        <h2 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Recent activity
        </h2>
        <RecentActivity history={history} />
      </section>

      <div className="mt-9 flex items-center justify-center gap-4 px-1 text-center">
        <button
          onClick={onOpenGuide}
          className="text-xs font-medium text-ink-faint underline underline-offset-4 active:text-ink"
        >
          Finding your weight
        </button>
        <span className="text-ink-line">·</span>
        <button
          onClick={onOpenNotice}
          className="text-xs font-medium text-ink-faint underline underline-offset-4 active:text-ink"
        >
          Form &amp; safety
        </button>
      </div>
    </div>
  )
}
