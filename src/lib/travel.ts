import type { Exercise, Workout } from '../types'

/**
 * In Travel mode, swap an exercise for its no-equipment substitute (if it has
 * one), keeping the same id/category/emoji so progress and history line up.
 * Equipment-specific fields are stripped so nothing from the loaded version
 * leaks through.
 */
export function resolveExercise(ex: Exercise, travel: boolean): Exercise {
  if (!travel || !ex.travel) return ex
  const { travel: override, ...base } = ex
  return {
    ...base,
    startingLoadHint: undefined,
    loadNote: undefined,
    perHand: undefined,
    ...override,
  }
}

export function resolveWorkout(workout: Workout, travel: boolean): Workout {
  if (!travel) return workout
  return {
    ...workout,
    exercises: workout.exercises.map((ex) => resolveExercise(ex, travel)),
  }
}
