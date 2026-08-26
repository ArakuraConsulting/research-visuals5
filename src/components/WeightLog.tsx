import type { Exercise, ExerciseLog, Settings } from '../types'
import { barbellTotal, lastTimeLabel } from '../lib/equipment'

/**
 * Weight logging input, behaviour driven by the exercise's equipment:
 *  - barbell:   "Plates (kg)" + live "Total: X kg" (plates + bar)
 *  - dumbbell:  "Per hand (kg)", or "Dumbbell (kg)" when perHand is false
 *  - bodyweight:"Rung or variation" free text
 * Last session's value is pre-filled by the parent and shown as "Last time".
 */
export function WeightLog({
  exercise,
  settings,
  last,
  entryNum,
  entryText,
  onChange,
}: {
  exercise: Exercise
  settings: Settings
  last: ExerciseLog | undefined
  entryNum: string
  entryText: string
  onChange: (entryNum: string, entryText: string) => void
}) {
  const unit = settings.units
  const lastLabel = last ? lastTimeLabel(last, exercise) : null

  const LastTime = () =>
    lastLabel ? (
      <span className="shrink-0 rounded-lg bg-white shadow-card ring-1 ring-ink-line/60 px-2.5 py-1 text-xs font-semibold text-ink-soft">
        Last time: {lastLabel}
      </span>
    ) : null

  const inputClass =
    'w-full rounded-2xl border border-ink-line bg-white ring-1 ring-ink-line px-4 py-3.5 text-base text-ink placeholder:text-ink-faint focus:border-accent-500 focus:outline-none'

  if (exercise.equipment === 'barbell') {
    const total = barbellTotal(entryNum, settings)
    return (
      <div className="w-full">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor={`w-${exercise.id}`}
            className="text-xs font-semibold uppercase tracking-wide text-ink-faint"
          >
            Plates ({unit})
          </label>
          <LastTime />
        </div>
        <input
          id={`w-${exercise.id}`}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          value={entryNum}
          onChange={(e) => onChange(e.target.value, entryText)}
          placeholder={exercise.startingLoadHint ?? ''}
          className={inputClass}
        />
        <p className="mt-1.5 px-1 text-sm text-ink-faint">
          Total:{' '}
          <span className="font-semibold text-ink-soft">
            {total} {unit}
          </span>{' '}
          <span className="text-ink-faint">
            ({entryNum ? entryNum : 0} plates + {settings.barWeightKg} bar)
          </span>
        </p>
      </div>
    )
  }

  if (exercise.equipment === 'dumbbell') {
    const label = exercise.perHand ? `Per hand (${unit})` : `Dumbbell (${unit})`
    return (
      <div className="w-full">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor={`w-${exercise.id}`}
            className="text-xs font-semibold uppercase tracking-wide text-ink-faint"
          >
            {label}
          </label>
          <LastTime />
        </div>
        <input
          id={`w-${exercise.id}`}
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          value={entryNum}
          onChange={(e) => onChange(e.target.value, entryText)}
          placeholder={exercise.startingLoadHint ?? ''}
          className={inputClass}
        />
      </div>
    )
  }

  if (exercise.equipment === 'bodyweight') {
    return (
      <div className="w-full">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor={`w-${exercise.id}`}
            className="text-xs font-semibold uppercase tracking-wide text-ink-faint"
          >
            Rung or variation
          </label>
          <LastTime />
        </div>
        <input
          id={`w-${exercise.id}`}
          type="text"
          value={entryText}
          onChange={(e) => onChange(entryNum, e.target.value)}
          placeholder="e.g. negatives, red band, strict"
          className={inputClass}
        />
      </div>
    )
  }

  return null
}
