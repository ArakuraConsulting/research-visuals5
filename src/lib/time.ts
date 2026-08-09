import type { Exercise, Workout } from '../types'

const REST_BETWEEN_EXERCISES = 30 // seconds

/** Total seconds of work for one exercise (duration x rounds, or 0 for sets). */
export function exerciseWorkSeconds(ex: Exercise): number {
  if (ex.type === 'timed') {
    return (ex.durationSeconds ?? 0) * (ex.rounds ?? 1)
  }
  return 0
}

/**
 * Computed total time for a timed workout, in seconds:
 * sum of (duration x rounds) plus 30s rest between exercises.
 * (Callers round to the nearest minute for display.)
 */
export function computeWorkoutSeconds(workout: Workout): number {
  const work = workout.exercises.reduce(
    (acc, ex) => acc + exerciseWorkSeconds(ex),
    0,
  )
  const rest =
    workout.exercises.length > 1
      ? (workout.exercises.length - 1) * REST_BETWEEN_EXERCISES
      : 0
  return work + rest
}

/** Nearest-minute label for a timed workout, e.g. "58 min". */
export function workoutTotalLabel(workout: Workout): string {
  const minutes = Math.round(computeWorkoutSeconds(workout) / 60)
  return `${minutes} min`
}

/** "mm:ss" or "h:mm:ss" for elapsed / countdown clocks. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}

/** Short, human label like "3 x 30 sec" or "3 x 6-8". */
export function exerciseSummary(ex: Exercise): string {
  if (ex.type === 'timed') {
    const rounds = ex.rounds ?? 1
    return `${rounds} x ${ex.durationSeconds ?? 0} sec`
  }
  const sets = ex.sets ?? 0
  return ex.repRange ? `${sets} x ${ex.repRange}` : `${sets} sets`
}

/** Local date, e.g. "9 Aug 2026". */
export function formatDate(dateISO: string): string {
  const d = new Date(dateISO)
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Local month + year, used as a history group heading. */
export function formatMonth(dateISO: string): string {
  const d = new Date(dateISO)
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

/** Compact elapsed label for cards/lists, e.g. "42 min" or "1:05:00". */
export function formatElapsedShort(totalSeconds: number): string {
  if (totalSeconds >= 3600) return formatClock(totalSeconds)
  const minutes = Math.round(totalSeconds / 60)
  return `${minutes} min`
}
