import type { Exercise, ExerciseProgress, Workout } from '../types'

/** An exercise counts as done if marked done, or (for sets) fully filled. */
export function isExerciseDone(
  ex: Exercise,
  p: ExerciseProgress | undefined,
): boolean {
  if (!p) return false
  if (p.done) return true
  if (ex.type === 'sets') return p.completedSets >= (ex.sets ?? 1)
  return false
}

/** How many exercises of a workout are done, given its saved progress. */
export function doneCountFor(
  workout: Workout,
  progress: Record<string, ExerciseProgress> | undefined,
): number {
  if (!progress) return 0
  return workout.exercises.filter((ex) => isExerciseDone(ex, progress[ex.id]))
    .length
}
