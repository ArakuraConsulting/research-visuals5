export type Category = 'Strength' | 'Cardio' | 'Flexibility' | 'Mindfulness'
export type ExerciseType = 'timed' | 'sets'

export interface Exercise {
  id: string
  name: string
  category: Category
  type: ExerciseType
  /** When type is "timed": seconds per round */
  durationSeconds?: number
  /** When type is "timed": number of rounds (default 1) */
  rounds?: number
  /** When type is "sets": number of sets */
  sets?: number
  /** When type is "sets": e.g. "6-8" */
  repRange?: string
  /** One line cue, shown under the name in the list */
  cue?: string
  /** Array of form points, shown in the active workout view */
  form?: string[]
}

export interface Workout {
  id: string
  name: string
  description: string
  /** true -> show a computed total time; false -> show "Untimed" */
  timed: boolean
  exercises: Exercise[]
}

export interface LoggedWeight {
  exerciseName: string
  weight: string
}

export interface HistoryEntry {
  id: string
  workoutId: string
  workoutName: string
  dateISO: string
  elapsedSeconds: number
  completedExerciseCount: number
  /** Any weights logged during the session */
  weights?: LoggedWeight[]
}

/** Per-exercise progress captured during an active session. */
export interface ExerciseProgress {
  /** For "sets" exercises: how many sets have been filled */
  completedSets: number
  /** For "sets" exercises: free-text weight used */
  weight: string
  /** Whether the exercise was finished (not skipped) */
  completed: boolean
}

/** In-progress workout state, persisted so a lock/refresh can resume. */
export interface ActiveSession {
  workoutId: string
  workoutName: string
  /** Epoch ms when Start was pressed */
  startedAt: number
  dateISO: string
  currentIndex: number
  progress: Record<string, ExerciseProgress>
}
