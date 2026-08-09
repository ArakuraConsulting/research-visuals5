import { useEffect, useMemo, useState } from 'react'
import type {
  ActiveSession,
  ExerciseLog,
  ExerciseProgress,
  HistoryEntry,
  LoggedWeight,
  Settings,
  Workout,
} from '../types'
import { CategoryPill, PrimaryButton, SecondaryButton } from './ui'
import { ConfirmDialog } from './ConfirmDialog'
import { TimedExercise } from './TimedExercise'
import { SetsExercise } from './SetsExercise'
import { WeightLog } from './WeightLog'
import { LoadNote } from './LoadNote'
import { HowTo } from './HowTo'
import { CompletionScreen } from './CompletionScreen'
import { formatClock } from '../lib/time'
import { useInterval } from '../lib/useInterval'
import { useWakeLock } from '../lib/useWakeLock'
import { makeId } from '../lib/util'
import {
  buildLog,
  isLoggable,
  lastTimeLabel,
  prefillNum,
  prefillText,
  sameAsLastWeight,
} from '../lib/equipment'

function defaultProgress(): ExerciseProgress {
  return { completedSets: 0, completed: false, entryNum: '', entryText: '' }
}

export function ActiveWorkout({
  workout,
  session,
  settings,
  exerciseLog,
  loadNoteAcks,
  onAckLoadNote,
  onChange,
  onDiscard,
  onFinish,
}: {
  workout: Workout
  session: ActiveSession
  settings: Settings
  exerciseLog: Record<string, ExerciseLog>
  loadNoteAcks: Record<string, boolean>
  onAckLoadNote: (id: string) => void
  /** Persist structural changes (index/progress) to storage. */
  onChange: (session: ActiveSession) => void
  /** Abandon: clear the session, write nothing to history. */
  onDiscard: () => void
  /** Complete: write a history entry + updated logs and return home. */
  onFinish: (entry: HistoryEntry, logs: Record<string, ExerciseLog>) => void
}) {
  // Initial progress: reuse anything the session already has (resume), else seed
  // loggable exercises with their last-session values so they pre-fill.
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
  const [index, setIndex] = useState(session.currentIndex)
  const [now, setNow] = useState(() => Date.now())
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [finished, setFinished] = useState(false)
  const [dismissedPrompts, setDismissedPrompts] = useState<
    Record<string, boolean>
  >({})

  const total = workout.exercises.length
  const exercise = workout.exercises[index]
  const current = progress[exercise.id] ?? defaultProgress()
  const last = exerciseLog[exercise.id]

  useWakeLock(!finished)
  useInterval(() => setNow(Date.now()), finished ? null : 250)
  const elapsedSeconds = Math.max(0, Math.floor((now - session.startedAt) / 1000))

  useEffect(() => {
    onChange({ ...session, currentIndex: index, progress })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, progress])

  const updateProgress = (id: string, partial: Partial<ExerciseProgress>) => {
    setProgress((prev) => ({
      ...prev,
      [id]: { ...defaultProgress(), ...prev[id], ...partial },
    }))
  }

  const isLast = index === total - 1
  const setsComplete =
    exercise.type === 'sets'
      ? current.completedSets >= (exercise.sets ?? 1)
      : true
  const canAdvance = exercise.type === 'timed' ? true : setsComplete

  // Progression prompt: sets done + same weight as last session.
  const showProgressionPrompt =
    exercise.type === 'sets' &&
    setsComplete &&
    sameAsLastWeight(exercise, current.entryNum, last) &&
    !dismissedPrompts[exercise.id]

  const completedCount = useMemo(
    () =>
      workout.exercises.filter((ex) => {
        const p = progress[ex.id]
        if (!p) return false
        if (ex.type === 'sets') return p.completedSets >= (ex.sets ?? 1)
        return p.completed
      }).length,
    [workout.exercises, progress],
  )

  const goNext = () => {
    if (isLast) return setFinished(true)
    setIndex((i) => Math.min(total - 1, i + 1))
  }
  const goBack = () => setIndex((i) => Math.max(0, i - 1))
  const skip = () => {
    if (isLast) return setFinished(true)
    setIndex((i) => Math.min(total - 1, i + 1))
  }

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
      completedExerciseCount: completedCount,
      weights: weights.length > 0 ? weights : undefined,
    }
    onFinish(entry, logs)
  }

  if (finished) {
    return (
      <CompletionScreen
        workoutName={workout.name}
        elapsedSeconds={elapsedSeconds}
        completedCount={completedCount}
        totalCount={total}
        onDone={handleFinish}
      />
    )
  }

  const progressPct = Math.round(((index + 1) / total) * 100)

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <header className="sticky top-0 z-10 bg-navy-950/95 px-4 pb-3 pt-4 backdrop-blur safe-top">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-accent-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-2xl font-bold tabular-nums text-white">
              {formatClock(elapsedSeconds)}
            </span>
            <span className="text-sm font-semibold text-white/50">
              {index + 1} of {total}
            </span>
          </div>
          <button
            onClick={() => setConfirmEnd(true)}
            className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm font-semibold text-rose-300 active:scale-95"
          >
            End
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 pb-32 pt-4">
        <div className="mb-2 flex items-center gap-3">
          <CategoryPill category={exercise.category} />
        </div>
        <h1 className="text-3xl font-extrabold leading-tight text-white">
          {exercise.name}
        </h1>
        {exercise.cue && (
          <p className="mt-1 text-base text-white/60">{exercise.cue}</p>
        )}

        {/* How to do it — beginner-friendly steps */}
        {exercise.howTo && exercise.howTo.length > 0 && (
          <div className="mt-4">
            <HowTo key={exercise.id} steps={exercise.howTo} />
          </div>
        )}

        {/* Equipment loading / clearance note (one-time on first use) */}
        {exercise.loadNote && exercise.loadNote.length > 0 && (
          <div className="mt-4">
            <LoadNote
              points={exercise.loadNote}
              acked={!!loadNoteAcks[exercise.id]}
              onAck={() => onAckLoadNote(exercise.id)}
            />
          </div>
        )}

        {/* Form points — always visible. */}
        {exercise.form && exercise.form.length > 0 && (
          <ul className="mt-4 space-y-2 rounded-3xl bg-white/5 p-4">
            {exercise.form.map((point, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-[15px] leading-relaxed text-white/80"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Type-specific controls */}
        <div className="mt-8">
          {exercise.type === 'timed' ? (
            <TimedExercise
              key={exercise.id}
              exercise={exercise}
              onComplete={() => updateProgress(exercise.id, { completed: true })}
              onSkip={skip}
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

        {/* Weight / load logging */}
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

        {/* Progression prompt — one line, one session, dismissible */}
        {showProgressionPrompt && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-accent-500/10 px-4 py-3">
            <p className="flex-1 text-sm leading-relaxed text-accent-200">
              Same weight as last time. If the last set had two reps left in it,
              go up next session.
            </p>
            <button
              onClick={() =>
                setDismissedPrompts((p) => ({ ...p, [exercise.id]: true }))
              }
              aria-label="Dismiss"
              className="shrink-0 rounded-lg px-2 py-1 text-accent-300 active:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-navy-950/95 px-4 pb-6 pt-3 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-md gap-3">
          <SecondaryButton
            onClick={goBack}
            disabled={index === 0}
            className="flex-1"
          >
            Back
          </SecondaryButton>
          <PrimaryButton
            onClick={goNext}
            disabled={!canAdvance}
            className="flex-[2]"
          >
            {isLast ? 'Finish' : 'Next'}
          </PrimaryButton>
        </div>
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="End workout?"
        message="Your progress for this session will be discarded and nothing will be saved to history."
        confirmLabel="End workout"
        cancelLabel="Keep going"
        destructive
        onConfirm={onDiscard}
        onCancel={() => setConfirmEnd(false)}
      />
    </div>
  )
}
