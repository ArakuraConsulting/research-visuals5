import { useEffect, useMemo, useState } from 'react'
import type {
  ActiveSession,
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
import { CompletionScreen } from './CompletionScreen'
import { exerciseSummary, formatClock } from '../lib/time'
import { useInterval } from '../lib/useInterval'
import { useWakeLock } from '../lib/useWakeLock'
import { isMusicPlaying, startMusic, stopMusic } from '../lib/music'
import { makeId } from '../lib/util'
import {
  buildLog,
  equipmentSummary,
  isLoggable,
  lastTimeLabel,
  prefillNum,
  prefillText,
  sameAsLastWeight,
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
  loadNoteAcks,
  onAckLoadNote,
  onChange,
  onHome,
  onDiscard,
  onFinish,
}: {
  workout: Workout
  session: ActiveSession
  settings: Settings
  exerciseLog: Record<string, ExerciseLog>
  loadNoteAcks: Record<string, boolean>
  onAckLoadNote: (id: string) => void
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
  const [dismissedPrompts, setDismissedPrompts] = useState<Record<string, boolean>>({})
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

  const handleFinish = () => {
    const logs: Record<string, ExerciseLog> = {}
    const weights: LoggedWeight[] = []
    for (const ex of workout.exercises) {
      const p = progress[ex.id]
      if (!p) continue
      const log = buildLog(ex, p.entryNum, p.entryText, settings)
      if (log) {
        logs[ex.id] = log
        weights.push({ exerciseName: ex.name, weight: lastTimeLabel(log, ex) })
      }
    }
    const entry: HistoryEntry = {
      id: makeId('hist'),
      workoutId: workout.id,
      workoutName: workout.name,
      dateISO: session.dateISO,
      elapsedSeconds,
      completedExerciseCount: doneCount,
      weights: weights.length > 0 ? weights : undefined,
    }
    onFinish(entry, logs)
  }

  if (finished) {
    return (
      <CompletionScreen
        workoutName={workout.name}
        elapsedSeconds={elapsedSeconds}
        completedCount={doneCount}
        totalCount={total}
        onDone={handleFinish}
      />
    )
  }

  // Shared top bar (home / clock+done / end).
  const TopBar = () => (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-navy-950/95 px-4 pb-3 pt-4 backdrop-blur safe-top">
      <button
        onClick={onHome}
        aria-label="Home"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      </button>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xl font-bold tabular-nums text-white/80">
          {formatClock(elapsedSeconds)}
        </span>
        <span className="text-sm font-semibold text-accent-300">
          {doneCount}/{total} done
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMusic}
          aria-label={music ? 'Turn music off' : 'Turn music on'}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95 ${
            music ? 'bg-accent-500 text-white' : 'bg-white/10 text-white/70'
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
          className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-300 active:scale-95"
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
    const showProgressionPrompt =
      exercise.type === 'sets' &&
      current.completedSets >= (exercise.sets ?? 1) &&
      sameAsLastWeight(exercise, current.entryNum, last) &&
      !dismissedPrompts[exercise.id]

    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col">
        <TopBar />
        <div className="flex-1 px-4 pb-40 pt-2">
          <button
            onClick={() => setFocusIndex(null)}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 active:opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            All exercises
          </button>

          <div className="mb-2 flex items-center gap-3">
            <CategoryPill category={exercise.category} />
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-white">
            {exercise.emoji && <span className="mr-2">{exercise.emoji}</span>}
            {exercise.name}
          </h1>
          {exercise.blurb && (
            <p className="mt-1 text-base text-white/75">{exercise.blurb}</p>
          )}
          {exercise.cue && (
            <p className="mt-0.5 text-sm italic text-white/50">{exercise.cue}</p>
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
            <ul className="mt-4 space-y-2 rounded-3xl bg-white/5 p-4">
              {exercise.form.map((point, i) => (
                <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-white/80">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}

          {exercise.warmUp && exercise.warmUp.length > 0 && (
            <div className="mt-4 rounded-3xl bg-sky-500/10 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-sky-300">
                <span aria-hidden="true">🔥</span> Warm up first
              </p>
              <ul className="space-y-1.5">
                {exercise.warmUp.map((point, i) => (
                  <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-white/80">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Optional timer / sets */}
          <div className="mt-8">
            {exercise.type === 'timed' && exercise.externalTimer ? (
              <div className="rounded-3xl bg-white/5 p-5 text-center">
                <p className="text-[15px] leading-relaxed text-white/70">
                  You time this with your own app or device
                  {exercise.durationSeconds
                    ? ` (about ${Math.round(exercise.durationSeconds / 60)} min)`
                    : ''}
                  . Tap{' '}
                  <span className="font-semibold text-white">Mark as done</span>{' '}
                  below when you’ve finished.
                </p>
              </div>
            ) : exercise.type === 'timed' ? (
              <TimedExercise
                key={exercise.id}
                exercise={exercise}
                onComplete={() => updateProgress(exercise.id, { done: true })}
                onSkip={() => setFocusIndex(null)}
              />
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

          {exercise.coolDown && exercise.coolDown.length > 0 && (
            <div className="mt-6 rounded-3xl bg-emerald-500/10 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-300">
                <span aria-hidden="true">🧘</span> Cool down &amp; stretch after
              </p>
              <ul className="space-y-1.5">
                {exercise.coolDown.map((point, i) => (
                  <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-white/80">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showProgressionPrompt && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-accent-500/10 px-4 py-3">
              <p className="flex-1 text-sm leading-relaxed text-accent-200">
                Same weight as last time. If the last set had two reps left in it,
                go up next session.
              </p>
              <button
                onClick={() => setDismissedPrompts((p) => ({ ...p, [exercise.id]: true }))}
                aria-label="Dismiss"
                className="shrink-0 rounded-lg px-2 py-1 text-accent-300 active:text-white"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Bottom: mark done + back to list */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-navy-950/95 px-4 pb-6 pt-3 backdrop-blur safe-bottom">
          <div className="mx-auto max-w-md">
            <PrimaryButton
              onClick={() => {
                toggleDone(exercise.id)
                if (!done) setFocusIndex(null)
              }}
              className={done ? '!bg-emerald-600' : ''}
            >
              {done ? 'Done ✓ — tap to undo' : 'Mark as done'}
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
        <h1 className="px-1 text-xl font-extrabold text-white">{workout.name}</h1>
        <p className="mt-0.5 px-1 text-sm text-white/60">{workout.description}</p>
        <p className="mt-1 px-1 text-xs text-white/40">
          {equipmentSummary(workout)}
        </p>
        <p className="mb-4 mt-3 px-1 text-sm text-white/50">
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
                className={`flex items-center gap-3 rounded-3xl border p-3 transition ${
                  done
                    ? 'border-emerald-400/30 bg-emerald-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <button
                  onClick={() => toggleDone(ex.id)}
                  aria-label={done ? `Mark ${ex.name} not done` : `Mark ${ex.name} done`}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
                    done ? 'bg-emerald-500 text-white' : 'border-2 border-white/25 text-transparent'
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
                    <p className={`truncate font-bold ${done ? 'text-white/70' : 'text-white'}`}>
                      {ex.emoji && <span className="mr-1.5">{ex.emoji}</span>}
                      {ex.name}
                    </p>
                    {ex.blurb && (
                      <p className="mt-0.5 truncate text-xs text-white/45">
                        {ex.blurb}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs font-semibold text-white/50">
                      {exerciseSummary(ex)}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-accent-300">
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

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-navy-950/95 px-4 pb-6 pt-3 backdrop-blur safe-bottom">
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
