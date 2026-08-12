import type { HistoryEntry, Workout } from '../types'
import { Card } from './ui'
import { formatDate, formatElapsedShort, workoutTotalLabel } from '../lib/time'

function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function WorkoutCard({
  workout,
  onOpen,
}: {
  workout: Workout
  onOpen: () => void
}) {
  return (
    <Card as="button" onClick={onOpen} className="p-5">
      <h2 className="text-xl font-bold leading-tight">{workout.name}</h2>
      <p className="mt-1 text-sm text-navy-700/70">{workout.description}</p>
      <div className="mt-4 flex items-center gap-4 text-sm font-semibold text-navy-700">
        <span className="inline-flex items-center gap-1.5">
          <ListIcon />
          {workout.exercises.length} exercises
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ClockIcon />
          {workout.timed ? workoutTotalLabel(workout) : 'Untimed'}
        </span>
      </div>
    </Card>
  )
}

function RecentActivity({ history }: { history: HistoryEntry[] }) {
  const recent = history.slice(0, 5)
  if (recent.length === 0) {
    return (
      <div className="rounded-3xl bg-white/5 p-5 text-sm text-white/50">
        No sessions yet. Finish a workout and it will show up here.
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-3xl bg-white/5">
      {recent.map((h, i) => (
        <div
          key={h.id}
          className={`flex items-center justify-between px-5 py-3 ${
            i > 0 ? 'border-t border-white/5' : ''
          }`}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {h.workoutName}
            </p>
            <p className="text-xs text-white/50">{formatDate(h.dateISO)}</p>
          </div>
          <span className="ml-3 shrink-0 text-sm font-semibold text-accent-400">
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
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
  resumeName,
  onResume,
  onOpenWorkout,
  onOpenHistory,
  onOpenProgress,
  onOpenNotice,
  onOpenSettings,
  onOpenGuide,
}: {
  workouts: Workout[]
  history: HistoryEntry[]
  resumeName: string | null
  onResume: () => void
  onOpenWorkout: (id: string) => void
  onOpenHistory: () => void
  onOpenProgress: () => void
  onOpenNotice: () => void
  onOpenSettings: () => void
  onOpenGuide: () => void
}) {
  return (
    <div className="mx-auto min-h-full max-w-md px-4 pb-16 pt-4 safe-top">
      <header className="mb-6 flex items-end justify-between px-1">
        <div>
          <p className="text-sm font-medium text-accent-400">Let’s train</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Workouts
          </h1>
        </div>
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white active:scale-95"
        >
          <GearIcon />
        </button>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <button
          onClick={onOpenProgress}
          className="rounded-2xl bg-accent-500/15 px-4 py-3 text-sm font-bold text-accent-200 ring-1 ring-inset ring-accent-400/30 active:scale-[0.98]"
        >
          Progress
        </button>
        <button
          onClick={onOpenHistory}
          className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white active:scale-[0.98]"
        >
          History
        </button>
      </div>

      {resumeName && (
        <button
          onClick={onResume}
          className="mb-5 flex w-full items-center justify-between rounded-3xl bg-accent-500 px-5 py-4 text-left shadow-soft active:scale-[0.99]"
        >
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-white/80">
              In progress
            </span>
            <span className="block truncate text-lg font-bold text-white">
              Continue {resumeName}
            </span>
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}

      <div className="space-y-4">
        {workouts.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            onOpen={() => onOpenWorkout(w.id)}
          />
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-wide text-white/50">
          Recent activity
        </h2>
        <RecentActivity history={history} />
      </section>

      <div className="mt-8 flex items-center justify-center gap-4 px-1 text-center">
        <button
          onClick={onOpenGuide}
          className="text-xs font-medium text-white/40 underline underline-offset-4 active:text-white/70"
        >
          Finding your weight
        </button>
        <span className="text-white/20">·</span>
        <button
          onClick={onOpenNotice}
          className="text-xs font-medium text-white/40 underline underline-offset-4 active:text-white/70"
        >
          Form &amp; safety notice
        </button>
      </div>
    </div>
  )
}
