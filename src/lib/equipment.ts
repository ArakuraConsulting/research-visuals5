import type { Exercise, ExerciseLog, Settings, Workout } from '../types'

/** Does this exercise take a numeric or text load entry? */
export function isLoggable(ex: Exercise): boolean {
  return (
    ex.equipment === 'barbell' ||
    ex.equipment === 'dumbbell' ||
    ex.equipment === 'bodyweight'
  )
}

function parseNum(s: string): number | null {
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : null
}

/**
 * Build the persisted log for an exercise from the raw entry fields.
 * Returns null when nothing meaningful was entered.
 */
export function buildLog(
  ex: Exercise,
  entryNum: string,
  entryText: string,
  settings: Settings,
): ExerciseLog | null {
  const units = settings.units
  if (ex.equipment === 'barbell') {
    const plates = parseNum(entryNum)
    if (plates === null) return null
    return {
      equipment: 'barbell',
      units,
      plates,
      total: plates + settings.barWeightKg,
    }
  }
  if (ex.equipment === 'dumbbell') {
    const weight = parseNum(entryNum)
    if (weight === null) return null
    return { equipment: 'dumbbell', units, weight }
  }
  if (ex.equipment === 'bodyweight') {
    const variation = entryText.trim()
    if (!variation) return null
    return { equipment: 'bodyweight', units, variation }
  }
  return null
}

/** Live barbell total = entered plates (or 0) + bar weight. */
export function barbellTotal(entryNum: string, settings: Settings): number {
  return (parseNum(entryNum) ?? 0) + settings.barWeightKg
}

/** Human label for a stored log, used for "Last time" and history rows. */
export function formatLog(log: ExerciseLog): string {
  const u = log.units
  if (log.equipment === 'barbell') {
    return `${log.total ?? 0} ${u}`
  }
  if (log.equipment === 'dumbbell') {
    // perHand nuance is carried by the exercise, not the log; keep it simple.
    return `${log.weight ?? 0} ${u}`
  }
  if (log.equipment === 'bodyweight') {
    return log.variation ?? ''
  }
  return ''
}

/** "Last time" label with the per-hand nuance restored from the exercise. */
export function lastTimeLabel(log: ExerciseLog, ex: Exercise): string {
  if (log.equipment === 'dumbbell' && ex.perHand) {
    return `${log.weight ?? 0} ${log.units} per hand`
  }
  return formatLog(log)
}

/** Pre-fill numeric field from a prior log. */
export function prefillNum(log: ExerciseLog | undefined): string {
  if (!log) return ''
  if (log.equipment === 'barbell') return log.plates != null ? String(log.plates) : ''
  if (log.equipment === 'dumbbell') return log.weight != null ? String(log.weight) : ''
  return ''
}

/** Pre-fill text field from a prior log. */
export function prefillText(log: ExerciseLog | undefined): string {
  if (!log) return ''
  return log.equipment === 'bodyweight' ? (log.variation ?? '') : ''
}

/**
 * Is the currently entered weight the same as the last session's? Used by the
 * progression prompt. Only meaningful for barbell / dumbbell.
 */
export function sameAsLastWeight(
  ex: Exercise,
  entryNum: string,
  last: ExerciseLog | undefined,
): boolean {
  if (!last) return false
  const n = parseNum(entryNum)
  if (n === null) return false
  if (ex.equipment === 'barbell') return last.plates === n
  if (ex.equipment === 'dumbbell') return last.weight === n
  return false
}

/**
 * Equipment line for the detail screen, derived from the exercises.
 * e.g. "Barbell, dumbbells, mat, bench or sofa edge".
 */
export function equipmentSummary(workout: Workout): string {
  const parts: string[] = []
  const add = (s: string) => {
    if (!parts.includes(s)) parts.push(s)
  }
  const ids = new Set(workout.exercises.map((e) => e.id))
  const has = (id: string) => ids.has(id)

  const ordered: string[] = []
  if (workout.exercises.some((e) => e.equipment === 'barbell'))
    ordered.push('barbell')
  if (workout.exercises.some((e) => e.equipment === 'dumbbell'))
    ordered.push('dumbbells')
  if (has('sa-pull-up') || has('dp-dead-hang')) ordered.push('pull-up bar')

  const needsMat =
    workout.exercises.some(
      (e) => e.category === 'Flexibility' || e.category === 'Mindfulness',
    ) ||
    has('dp-hollow-hold') ||
    has('sa-pike-push-up') ||
    has('sb-wall-walk')
  if (needsMat) ordered.push('mat')

  if (has('sb-hip-thrust')) ordered.push('bench or sofa edge')

  ordered.forEach(add)
  if (parts.length === 0) return 'No equipment needed'
  const joined = parts.join(', ')
  return joined.charAt(0).toUpperCase() + joined.slice(1)
}
