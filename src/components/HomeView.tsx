import type { HistoryEntry, Workout } from '../types'
import { formatDate, formatElapsedShort, workoutTotalLabel } from '../lib/time'

/** Soft per-workout identity: a gradient cover tile, a deep tone, an emoji. */
const TONES: Record<string, { grad: string; tone: string; emoji: string }> = {
  'daily-practice': {
    grad: 'from-sage-light to-[#d7e5d8]',
    tone: 'text-sage-deep',
    emoji: '🌅',
  },
  'session-a': {
    grad: 'from-blush-light to-[#f0d8d1]',
    tone: 'text-blush-deep',
    emoji: '💪',
  },
  'session-b': {
    grad: 'from-lav-light to-[#ded8ed]',
    tone: 'text-lav-deep',
    emoji: '🦵',
  },
}
const FALLBACK = {
  grad: 'from-gold-light to-[#efe0c3]',
  tone: 'text-gold-deep',
  emoji: '🏋️',
}

function ClockIcon() {
  return (
    <svg
      width="15"
      height="15"
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
      width="15"
      height="15"
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
  progress,
}: {
  workout: Workout
  onOpen: () => void
  progress?: { done: number; total: number }
}) {
  const tone = TONES[workout.id] ?? FALLBACK
  const inProgress = progress && progress.done > 0
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0
  return (
    <button
      onClick={onOpen}
      className="group w-full rounded-3xl bg-white p-3 text-left shadow-card ring-1 ring-ink-line/60 transition active:scale-[0.99]"
    >
      <div className="flex items-stretch gap-3.5">
        <div
          className={`flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tone.grad}`}
        >
          <span className="text-4xl leading-none" aria-hidden="true">
            {tone.emoji}
          </span>
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display text-xl font-semibold leading-tight text-ink">
              {workout.name}
            </h2>
            {inProgress && (
              <span className="mt-0.5 shrink-0 rounded-full bg-accent-tint px-2 py-0.5 text-[11px] font-bold text-accent-600">
                {progress!.done}/{progress!.total}
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-soft">
            {workout.description}
          </p>
          <div className="mt-2 flex items-center gap-3.5 text-[12px] font-semibold text-ink-faint">
            <span className="inline-flex items-center gap-1">
              <ListIcon />
              {workout.exercises.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon />
              {workout.timed ? workoutTotalLabel(workout) : 'Untimed'}
            </span>
            <span className="ml-auto font-bold text-accent-600">
              {inProgress ? 'Continue' : 'Start'} →
            </span>
          </div>
        </div>
      </div>
      {inProgress && (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-cream-200">
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
      <div className="rounded-3xl bg-white p-5 text-sm text-ink-faint shadow-card ring-1 ring-ink-line/60">
        No sessions yet. Finish a workout and it will show up here.
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-line/60">
      {recent.map((h, i) => (
        <div
          key={h.id}
          className={`flex items-center justify-between px-5 py-3.5 ${
            i > 0 ? 'border-t border-ink-line' : ''
          }`}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">
              {h.workoutName}
            </p>
            <p className="text-xs text-ink-faint">{formatDate(h.dateISO)}</p>
          </div>
          <span className="ml-3 shrink-0 text-sm font-bold text-accent-600">
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
    <div className="mx-auto min-h-full max-w-md px-4 pb-16 pt-4 safe-top">
      <header className="mb-6 flex items-end justify-between px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">
            Arakura
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold leading-none tracking-tight text-ink">
            Your practice
          </h1>
        </div>
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-ink-line bg-white text-ink shadow-soft active:scale-95"
        >
          <GearIcon />
        </button>
      </header>

      {/* Home / Travel mode */}
      <div className="mb-5">
        <div className="flex gap-1 rounded-2xl bg-cream-200 p-1">
          <button
            onClick={() => onToggleTravel(false)}
            className={`flex-1 rounded-xl py-2.5 text-[15px] font-bold transition ${
              !travelMode
                ? 'bg-white text-ink shadow-soft'
                : 'text-ink-faint active:text-ink'
            }`}
          >
            🏠 Home
          </button>
          <button
            onClick={() => onToggleTravel(true)}
            className={`flex-1 rounded-xl py-2.5 text-[15px] font-bold transition ${
              travelMode
                ? 'bg-white text-ink shadow-soft'
                : 'text-ink-faint active:text-ink'
            }`}
          >
            ✈️ Travel
          </button>
        </div>
        <p className="mt-1.5 px-1 text-xs text-ink-faint">
          {travelMode
            ? 'Travel mode — bodyweight versions, no equipment needed.'
            : 'Home — full equipment (weights, bands, mat, bar).'}
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <button
          onClick={onOpenProgress}
          className="rounded-2xl bg-accent-tint px-4 py-3 text-sm font-bold text-accent-600 ring-1 ring-inset ring-accent-500/20 active:scale-[0.98]"
        >
          Progress
        </button>
        <button
          onClick={onOpenHistory}
          className="rounded-2xl border border-ink-line bg-white px-4 py-3 text-sm font-bold text-ink shadow-soft active:scale-[0.98]"
        >
          History
        </button>
      </div>

      <div className="space-y-3.5">
        {workouts.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            onOpen={() => onOpenWorkout(w.id)}
            progress={progressByWorkout[w.id]}
          />
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
          Recent activity
        </h2>
        <RecentActivity history={history} />
      </section>

      <div className="mt-8 flex items-center justify-center gap-4 px-1 text-center">
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
          Form &amp; safety notice
        </button>
      </div>
    </div>
  )
}
