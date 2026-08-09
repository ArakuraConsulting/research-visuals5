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
      <span className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/60">
        Last time: {lastLabel}
      </span>
    ) : null

  const inputClass =
    'w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-white/30 focus:border-accent-400 focus:outline-none'

  if (exercise.equipment === 'barbell') {
    const total = barbellTotal(entryNum, settings)
    return (
      <div className="w-full">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor={`w-${exercise.id}`}
            className="text-xs font-semibold uppercase tracking-wide text-white/50"
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
        <p className="mt-1.5 px-1 text-sm text-white/50">
          Total:{' '}
          <span className="font-semibold text-white/80">
            {total} {unit}
          </span>{' '}
          <span className="text-white/40">
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
            className="text-xs font-semibold uppercase tracking-wide text-white/50"
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
            className="text-xs font-semibold uppercase tracking-wide text-white/50"
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
