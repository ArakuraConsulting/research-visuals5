import { useState } from 'react'
import type { Exercise, Workout } from '../types'
import { BackButton, CategoryPill, PrimaryButton } from './ui'
import { exerciseSummary } from '../lib/time'

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const [open, setOpen] = useState(false)
  const hasForm = (exercise.form?.length ?? 0) > 0
  return (
    <div className="rounded-3xl bg-white p-4 text-navy-950 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight">{exercise.name}</h3>
          {exercise.cue && (
            <p className="mt-0.5 text-sm text-navy-700/70">{exercise.cue}</p>
          )}
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-xl bg-navy-900 px-3 py-1.5 text-sm font-bold text-white">
          {exerciseSummary(exercise)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <CategoryPill category={exercise.category} />
        {hasForm && (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent-600 active:opacity-70"
          >
            Form
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {hasForm && open && (
        <ul className="mt-3 space-y-2 border-t border-navy-950/10 pt-3">
          {exercise.form!.map((point, i) => (
            <li
              key={i}
              className="flex gap-2 text-sm leading-relaxed text-navy-800"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DetailView({
  workout,
  onBack,
  onStart,
}: {
  workout: Workout
  onBack: () => void
  onStart: () => void
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <header className="sticky top-0 z-10 bg-navy-950/90 px-4 pb-3 pt-4 backdrop-blur safe-top">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold text-white">
              {workout.name}
            </h1>
          </div>
        </div>
        <p className="mt-2 px-1 text-sm text-white/60">{workout.description}</p>
      </header>

      <div className="flex-1 space-y-3 px-4 pb-32 pt-2">
        {workout.exercises.map((ex, i) => (
          <div key={ex.id} className="flex gap-3">
            <span className="mt-4 w-5 shrink-0 text-right text-sm font-bold text-white/40">
              {i + 1}
            </span>
            <div className="flex-1">
              <ExerciseRow exercise={ex} />
            </div>
          </div>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-navy-950/95 px-4 pb-6 pt-3 backdrop-blur safe-bottom">
        <div className="mx-auto max-w-md">
          <PrimaryButton onClick={onStart}>Start Workout</PrimaryButton>
        </div>
      </div>
    </div>
  )
}
