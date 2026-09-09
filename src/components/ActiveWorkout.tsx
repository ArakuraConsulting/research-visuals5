import { useEffect, useMemo, useState } from 'react'
import type {
  ActiveSession,
  ExerciseEffort,
  Exercise,
  ExerciseLog,
  ExerciseProgress,
  HistoryEntry,
  LoggedWeight,
  Settings,
  Workout,
} from '../types'
import { CategoryPill, PrimaryButton } from './ui'
import { ConfirmDialog } from './ConfirmDialog'
import { TimedExercise } from './TimedExercise'
import { SetsExercise } from './SetsExercise'
import { WeightLog } from './WeightLog'
import { LoadNote } from './LoadNote'
import { HowTo } from './HowTo'
import { EffortCheckIn } from './EffortCheckIn'
import { CompletionScreen } from './CompletionScreen'
import { exerciseSummary, formatClock, isSameDay } from '../lib/time'
import { useInterval } from '../lib/useInterval'
import { useWakeLock } from '../lib/useWakeLock'
import { isMusicPlaying, startMusic, stopMusic } from '../lib/music'
import { logLoadKg, makeEffort, nextSessionNote } from '../lib/coach'
import { computeSessionStats } from '../lib/achievements'
import { makeId } from '../lib/util'
import {
  buildLog,
  equipmentSummary,
  isLoggable,
  lastTimeLabel,
  prefillNum,
  prefillText,
} from '../lib/equipment'

function defaultProgress(): ExerciseProgress {
  return { completedSets: 0, done: false, entryNum: '', entryText: '' }
}

/** An exercise counts as done if marked done, or (for sets) fully filled. */
function isDone(ex: Exercise, p: ExerciseProgress | undefined): boolean {
  if (!p) return false
  if (p.done) return true
  if (ex.type === 'sets') return p.completedSets >= (ex.sets ?? 1)
  return false
}

export function ActiveWorkout({
  workout,
  session,
  settings,
  exerciseLog,
  effortLog,
  loadNoteAcks,
  onAckLoadNote,
  onRecordEffort,
  onChange,
  onHome,
  onDiscard,
  onFinish,
}: {
  workout: Workout
  session: ActiveSession
  settings: Settings
  exerciseLog: Record<string, ExerciseLog>
  effortLog: Record<string, ExerciseEffort>
  loadNoteAcks: Record<string, boolean>
  onAckLoadNote: (id: string) => void
  onRecordEffort: (exerciseId: string, effort: ExerciseEffort) => void
  /** Persist progress to storage. */
  onChange: (session: ActiveSession) => void
  /** Leave to the home screen, keeping the session to resume later. */
  onHome: () => void
  /** Discard: clear the session, write nothing to history. */
  onDiscard: () => void
  /** Complete: write a history entry + updated logs and return home. */
  onFinish: (entry: HistoryEntry, logs: Record<string, ExerciseLog>) => void
}) {
  const [progress, setProgress] = useState<Record<string, ExerciseProgress>>(
    () => {
      const seeded: Record<string, ExerciseProgress> = {}
      for (const ex of workout.exercises) {
        const existing = session.progress[ex.id]
        if (existing) {
          seeded[ex.id] = { ...defaultProgress(), ...existing }
        } else if (isLoggable(ex)) {
          seeded[ex.id] = {
            ...defaultProgress(),
            entryNum: prefillNum(exerciseLog[ex.id]),
            entryText: prefillText(exerciseLog[ex.id]),
          }
        }
      }
      return seeded
    },
  )
  // null = the checklist; a number = focused on that exercise.
  const [focusIndex, setFocusIndex] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [finished, setFinished] = useState(false)
  const [music, setMusic] = useState(() => isMusicPlaying())

  const toggleMusic = () => {
    if (isMusicPlaying()) stopMusic()
    else startMusic()
    setMusic(isMusicPlaying())
  }
  // Stop the backing track when leaving the workout.
  useEffect(() => () => stopMusic(), [])

  const total = workout.exercises.length

  useWakeLock(!finished && focusIndex !== null)
  useInterval(() => setNow(Date.now()), finished ? null : 1000)
  const elapsedSeconds = Math.max(0, Math.floor((now - session.startedAt) / 1000))

  useEffect(() => {
    onChange({ ...session, currentIndex: focusIndex ?? 0, progress })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusIndex, progress])

  const updateProgress = (id: string, partial: Partial<ExerciseProgress>) => {
    setProgress((prev) => ({
      ...prev,
      [id]: { ...defaultProgress(), ...prev[id], ...partial },
    }))
  }
  const toggleDone = (id: string) => {
    setProgress((prev) => {
      const cur = { ...defaultProgress(), ...prev[id] }
      return { ...prev, [id]: { ...cur, done: !cur.done } }
    })
  }

  const doneCount = useMemo(
    () => workout.exercises.filter((ex) => isDone(ex, progress[ex.id])).length,
    [workout.exercises, progress],
  )

  // Everything derived from what's been logged this session: the logs to
  // persist, the weight list, the training tally, and any lift that beat its
  // previous load (a small "personal best" to celebrate on the finish screen).
  const result = useMemo(() => {
    const logs: Record<string, ExerciseLog> = {}
    const weights: LoggedWeight[] = []
    const highlights: string[] = []
    const fmtKg = (n: number) =>
      Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toFixed(1)
    for (const ex of workout.exercises) {
      const p = progress[ex.id]
      if (!p) continue
      const log = buildLog(ex, p.entryNum, p.entryText, settings)
      if (!log) continue
      logs[ex.id] = log
      weights.push({ exerciseName: ex.name, weight: lastTimeLabel(log, ex) })
      const prevKg = logLoadKg(exerciseLog[ex.id])
      const nowKg = logLoadKg(log)
      if (prevKg != null && nowKg != null && nowKg > prevKg) {
        highlights.push(
          `${ex.name} — ${lastTimeLabel(log, ex)}, up ${fmtKg(nowKg - prevKg)} kg`,
        )
      }
    }
    const stats = computeSessionStats(workout, progress, logs)
    return { logs, weights, stats, highlights }
  }, [workout, progress, settings, exerciseLog])

  const handleFinish = () => {
    const entry: HistoryEntry = {
      id: makeId('hist'),
      workoutId: workout.id,
      workoutName: workout.name,
      dateISO: session.dateISO,
      elapsedSeconds,
      completedExerciseCount: doneCount,
      weights: result.weights.length > 0 ? result.weights : undefined,
      stats: result.stats,
    }
    onFinish(entry, result.logs)
  }

  if (finished) {
    return (
      <CompletionScreen
        workoutName={workout.name}
        startedAtISO={session.dateISO}
        elapsedSeconds={elapsedSeconds}
        completedCount={doneCount}
        totalCount={total}
        stats={result.stats}
        highlights={result.highlights}
        onDone={handleFinish}
      />
    )
  }

  // Shared top bar (home / clock+done / end).
  const TopBar = () => (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-cream-100/85 px-4 pb-3 pt-4 backdrop-blur safe-top">
      <button
        onClick={onHome}
        aria-label="Home"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-line bg-white text-ink shadow-soft active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      </button>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xl font-bold tabular-nums text-ink-soft">
          {formatClock(elapsedSeconds)}
        </span>
        <span className="text-sm font-semibold text-accent-600">
          {doneCount}/{total} done
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMusic}
          aria-label={music ? 'Turn music off' : 'Turn music on'}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95 ${
            music ? 'bg-accent-500 text-white' : 'border border-ink-line bg-white text-ink-soft'
          }`}
        >
          {music ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
              <path d="M2 2l20 20" />
            </svg>
          )}
        </button>
        <button
          onClick={() => setConfirmEnd(true)}
          className="rounded-xl bg-rose-500/12 px-3 py-2 text-sm font-semibold text-rose-600 active:scale-95"
        >
          End
        </button>
      </div>
    </header>
  )

  const endDialog = (
    <ConfirmDialog
      open={confirmEnd}
      title="End & discard?"
      message="This clears the session and saves nothing to history. To keep what you've done, use “Save session” instead, or “Home” to come back later."
      confirmLabel="Discard"
      cancelLabel="Keep going"
      destructive
      onConfirm={onDiscard}
      onCancel={() => setConfirmEnd(false)}
    />
  )

  // ---- Focused single-exercise view ----
  if (focusIndex !== null) {
    const exercise = workout.exercises[focusIndex]
    const current = progress[exercise.id] ?? defaultProgress()
    const last = exerciseLog[exercise.id]
    const done = isDone(exercise, current)

    // Effort check-in + weight coaching (sets exercises only).
    const nowISO = new Date().toISOString()
    const liveLog = isLoggable(exercise)
      ? buildLog(exercise, current.entryNum, current.entryText, settings)
      : null
    const allSetsDone =
      exercise.type === 'sets' &&
      current.completedSets >= (exercise.sets ?? 1)
    const lastEffort = effortLog[exercise.id]
    const ratedToday =
      lastEffort && isSameDay(lastEffort.dateISO, nowISO)
        ? lastEffort.rating
        : undefined
    // Show last time's guidance only on a later day, not the same session.
    const coachNote =
      exercise.type === 'sets' && lastEffort && !ratedToday
        ? nextSessionNote(exercise, lastEffort)
        : null

    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col">
        <TopBar />
        <div className="flex-1 px-4 pb-40 pt-2">
          <button
            onClick={() => setFocusIndex(null)}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600 active:opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            All exercises
          </button>

          <div className="mb-2 flex items-center gap-3">
            <CategoryPill category={exercise.category} />
          </div>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-ink">
            {exercise.name}
          </h1>
          {exercise.blurb && (
            <p className="mt-1 text-base text-ink-soft">{exercise.blurb}</p>
          )}
          {exercise.cue && (
            <p className="mt-0.5 text-sm italic text-ink-faint">{exercise.cue}</p>
          )}

          {coachNote && (
            <div className="mt-3 rounded-2xl bg-accent-tint px-4 py-3 ring-1 ring-inset ring-accent-500/15">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-600">
                Coach
              </p>
              <p className="text-sm leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">{coachNote.headline}</span>{' '}
                {coachNote.detail}
              </p>
            </div>
          )}

          {exercise.howTo && exercise.howTo.length > 0 && (
            <div className="mt-4">
              <HowTo key={exercise.id} steps={exercise.howTo} />
            </div>
          )}

          {exercise.loadNote && exercise.loadNote.length > 0 && (
            <div className="mt-4">
              <LoadNote
                points={exercise.loadNote}
                acked={!!loadNoteAcks[exercise.id]}
                onAck={() => onAckLoadNote(exercise.id)}
              />
            </div>
          )}

          {exercise.form && exercise.form.length > 0 && (
            <ul className="mt-4 space-y-2 rounded-3xl bg-white p-4 shadow-card ring-1 ring-ink-line/60">
              {exercise.form.map((point, i) => (
                <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}

          {exercise.warmUp && exercise.warmUp.length > 0 && (
            <div className="mt-4 rounded-3xl bg-accent-tint p-4 ring-1 ring-inset ring-accent-500/15">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-600">
                Warm up first
              </p>
              <ul className="space-y-1.5">
                {exercise.warmUp.map((point, i) => (
                  <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-soft">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timer (all timed exercises) / sets. Every timed exercise gets the
              audible countdown + bell, so nothing needs the phone watched —
              even the ones you might also follow along in your own app. */}
          <div className="mt-8">
            {exercise.type === 'timed' ? (
              <>
                <TimedExercise
                  key={exercise.id}
                  exercise={exercise}
                  onComplete={() => updateProgress(exercise.id, { done: true })}
                  onSkip={() => setFocusIndex(null)}
                />
                {exercise.externalTimer && (
                  <p className="mt-3 text-center text-xs leading-relaxed text-ink-faint">
                    Prefer your own app or a video? Follow it alongside — this
                    just times the{' '}
                    {exercise.durationSeconds
                      ? `${Math.round(exercise.durationSeconds / 60)} minutes`
                      : 'round'}{' '}
                    and rings when you’re done.
                  </p>
                )}
              </>
            ) : (
              <SetsExercise
                key={exercise.id}
                exercise={exercise}
                completedSets={current.completedSets}
                onSetsChange={(completedSets) =>
                  updateProgress(exercise.id, { completedSets })
                }
              />
            )}
          </div>

          {isLoggable(exercise) && (
            <div className="mt-6">
              <WeightLog
                exercise={exercise}
                settings={settings}
                last={last}
                entryNum={current.entryNum}
                entryText={current.entryText}
                onChange={(entryNum, entryText) =>
                  updateProgress(exercise.id, { entryNum, entryText })
                }
              />
            </div>
          )}

          {allSetsDone && (
            <EffortCheckIn
              key={exercise.id}
              exercise={exercise}
              liveLog={liveLog}
              initial={ratedToday}
              onRate={(rating) =>
                onRecordEffort(
                  exercise.id,
                  makeEffort(exercise, rating, liveLog, nowISO),
                )
              }
            />
          )}
        </div>

        {/* Bottom: mark done + back to list */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-line bg-cream-100/90 px-4 pb-6 pt-3 backdrop-blur safe-bottom">
          <div className="mx-auto max-w-md">
            <PrimaryButton
              onClick={() => {
                toggleDone(exercise.id)
                if (!done) setFocusIndex(null)
              }}
              className={done ? '!bg-accent-600' : ''}
            >
              {done ? 'Done — tap to undo' : 'Mark as done'}
            </PrimaryButton>
          </div>
        </div>

        {endDialog}
      </div>
    )
  }

  // ---- Checklist view ----
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <TopBar />
      <div className="flex-1 px-4 pb-36 pt-2">
        <h1 className="px-1 text-2xl font-semibold tracking-tight text-ink">{workout.name}</h1>
        <p className="mt-0.5 px-1 text-sm text-ink-soft">{workout.description}</p>
        <p className="mt-1 px-1 text-xs text-ink-faint">
          {equipmentSummary(workout)}
        </p>
        <p className="mb-4 mt-3 px-1 text-sm text-ink-faint">
          Tap any exercise to do it or tick it off — any order. Your ticks are
          saved as you go, so you can leave and come back any time today to
          finish the rest.
        </p>

        <div className="space-y-2.5">
          {workout.exercises.map((ex, i) => {
            const p = progress[ex.id]
            const done = isDone(ex, p)
            return (
              <div
                key={ex.id}
                className={`flex items-center gap-3 rounded-3xl border p-3 shadow-card transition ${
                  done
                    ? 'border-accent-500/30 bg-accent-tint'
                    : 'border-ink-line bg-cream-50'
                }`}
              >
                <button
                  onClick={() => toggleDone(ex.id)}
                  aria-label={done ? `Mark ${ex.name} not done` : `Mark ${ex.name} done`}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
                    done ? 'bg-accent-500 text-white' : 'border-2 border-ink-line text-transparent'
                  }`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </button>

                <button
                  onClick={() => setFocusIndex(i)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                >
                  <div className="min-w-0">
                    <p className={`truncate font-medium ${done ? 'text-ink-faint line-through' : 'text-ink'}`}>
                      {ex.name}
                    </p>
                    {ex.blurb && (
                      <p className="mt-0.5 truncate text-xs text-ink-faint">
                        {ex.blurb}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs font-semibold text-ink-faint">
                      {exerciseSummary(ex)}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-accent-600">
                    Open
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-line bg-cream-100/90 px-4 pb-6 pt-3 backdrop-blur safe-bottom">
        <div className="mx-auto max-w-md">
          <PrimaryButton onClick={() => setFinished(true)} disabled={doneCount === 0}>
            {doneCount === 0
              ? 'Mark something done to save'
              : `Save session (${doneCount}/${total})`}
          </PrimaryButton>
        </div>
      </div>

      {endDialog}
    </div>
  )
}
