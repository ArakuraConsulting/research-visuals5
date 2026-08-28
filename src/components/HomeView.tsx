import type { ExerciseLog, HistoryEntry, Workout } from '../types'
import { formatDate, formatElapsedShort, workoutTotalLabel } from '../lib/time'
import { computeStats } from '../lib/stats'
import { currentLoads, weekTotals } from '../lib/achievements'

/**
 * A calm cover photograph per workout, unified to the warm palette with a soft
 * wash so the set reads as one editorial system. Falls back to the hero image.
 */
const COVERS: Record<string, string> = {
  'daily-practice': 'cover-daily.jpg',
  'session-a': 'cover-a.jpg',
  'session-b': 'cover-b.jpg',
}
function coverFor(id: string) {
  return `${import.meta.env.BASE_URL}${COVERS[id] ?? 'hero.jpg'}`
}
// A gentle warm duotone so mixed photography settles into the sage/oak palette.
const COVER_FILTER = 'saturate(0.8) contrast(1.02) brightness(1.02) sepia(0.12)'

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
      className="group block w-full overflow-hidden rounded-3xl bg-cream-50 text-left shadow-card ring-1 ring-ink-line/70 transition active:scale-[0.99]"
    >
      <div className="relative h-28 w-full overflow-hidden">
        <img
          src={coverFor(workout.id)}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-active:scale-[1.03]"
          style={{ filter: COVER_FILTER, objectPosition: '50% 42%' }}
        />
        {/* Warm oak wash for palette unity + legibility of the name */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(58,48,36,0.12) 0%, rgba(46,38,28,0.04) 42%, rgba(38,30,22,0.62) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
          <h2 className="text-lg font-semibold tracking-tight text-white [text-shadow:0_1px_10px_rgba(28,22,16,0.45)]">
            {workout.name}
          </h2>
          {inProgress && (
            <span className="mb-0.5 shrink-0 rounded-full bg-cream-50/90 px-2 py-0.5 text-xs font-semibold tabular-nums text-accent-600 backdrop-blur-sm">
              {progress!.done}/{progress!.total}
            </span>
          )}
        </div>
      </div>
      <div className="p-4 pt-3">
        <p className="line-clamp-1 text-[13px] text-ink-faint">
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
        {inProgress && (
          <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-cream-200">
            <div
              className="h-full rounded-full bg-accent-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </button>
  )
}

/** "1h 45m" / "45m" / "0m" from seconds. */
function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m`
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl bg-cream-100 px-2 py-3 text-center">
      <p className="text-2xl font-semibold tabular-nums text-accent-600">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-ink-faint">{label}</p>
    </div>
  )
}

/**
 * A weekly achievement card: sessions, streak and training time this week, the
 * total weight moved, and the current working load for each lift — so progress
 * accumulates across the week instead of resetting to zero each day.
 */
function ThisWeek({
  workouts,
  history,
  exerciseLog,
  onOpenProgress,
}: {
  workouts: Workout[]
  history: HistoryEntry[]
  exerciseLog: Record<string, ExerciseLog>
  onOpenProgress: () => void
}) {
  const week = weekTotals(history)
  const stats = computeStats(history)
  const loads = currentLoads(workouts, exerciseLog)
  const nothingYet = week.sessions === 0 && loads.length === 0

  return (
    <section className="mb-6 rounded-3xl bg-cream-50 p-4 shadow-card ring-1 ring-ink-line/70">
      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
          This week
        </p>
        <button
          onClick={onOpenProgress}
          className="text-xs font-semibold text-accent-600 active:opacity-70"
        >
          Details
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        <Stat value={week.sessions} label="Sessions" />
        <Stat value={stats.streak} label="Day streak" />
        <Stat value={formatDuration(week.seconds)} label="Trained" />
      </div>

      {week.kg > 0 && (
        <p className="mt-3 px-1 text-sm text-ink-soft">
          <span className="font-semibold text-ink">
            ~{week.kg.toLocaleString()} kg
          </span>{' '}
          moved this week — nice work.
        </p>
      )}

      {loads.length > 0 && (
        <div className="mt-4 border-t border-ink-line pt-3">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Current loads
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {loads.map((r) => (
              <span
                key={r.id}
                className="rounded-full bg-cream-200 px-2.5 py-1 text-[12px] font-medium text-ink-soft"
              >
                {r.name} · <span className="font-semibold text-ink">{r.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {nothingYet && (
        <p className="mt-3 px-1 text-sm leading-relaxed text-ink-faint">
          Finish a session and your weekly totals and current loads will build
          up here — you don’t have to do everything every day.
        </p>
      )}
    </section>
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
  exerciseLog,
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
  exerciseLog: Record<string, ExerciseLog>
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
  const heroMask =
    'linear-gradient(to bottom, #000 0%, #000 32%, rgba(0,0,0,0.45) 58%, transparent 82%)'
  return (
    <div className="relative mx-auto min-h-full max-w-md pb-16">
      {/* Hero photograph, dissolving into the page so it reads as a backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[300px] overflow-hidden"
        style={{ WebkitMaskImage: heroMask, maskImage: heroMask }}
      >
        <img
          src={`${import.meta.env.BASE_URL}hero.jpg`}
          alt=""
          className="h-full w-full object-cover object-[50%_26%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(41,35,29,0.36) 0%, rgba(41,35,29,0.08) 34%, rgba(41,35,29,0) 56%)',
          }}
        />
      </div>

      <div className="relative px-5 pt-6 safe-top">
        <header className="mb-8 flex items-start justify-between px-1 pt-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cream-100/95 [text-shadow:0_1px_8px_rgba(28,22,16,0.4)]">
              Arakura
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white [text-shadow:0_1px_12px_rgba(28,22,16,0.42)]">
              Your practice
            </h1>
          </div>
          <button
            onClick={onOpenSettings}
            aria-label="Settings"
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-cream-50/85 text-ink-soft ring-1 ring-white/40 backdrop-blur-sm active:scale-95"
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
        <p className="mt-2 px-1 text-xs text-ink-soft">
          {travelMode
            ? 'Bodyweight versions, no equipment needed.'
            : 'Full equipment — weights, bands, mat, bar.'}
        </p>
      </div>

      <ThisWeek
        workouts={workouts}
        history={history}
        exerciseLog={exerciseLog}
        onOpenProgress={onOpenProgress}
      />

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
    </div>
  )
}
