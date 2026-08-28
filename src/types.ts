export type Category = 'Strength' | 'Cardio' | 'Flexibility' | 'Mindfulness'
export type ExerciseType = 'timed' | 'sets'
export type Equipment = 'barbell' | 'dumbbell' | 'bodyweight' | 'none'
export type Units = 'kg' | 'lb'

export interface Exercise {
  id: string
  name: string
  /** Fun little icon shown next to the name */
  emoji?: string
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
  /** Short one-line explanation of what the activity is, shown under the title */
  blurb?: string
  /** One line cue, shown under the name in the list */
  cue?: string
  /** Plain-language steps explaining what the movement is and how to do it */
  howTo?: string[]
  /** Array of form points, shown in the active workout view */
  form?: string[]
  /** What the movement is loaded with */
  equipment?: Equipment
  /** Placeholder text for the weight field */
  startingLoadHint?: string
  /** Equipment-specific warning, surfaced on first use */
  loadNote?: string[]
  /** For dumbbell lifts: true = one per hand, false = a single dumbbell */
  perHand?: boolean
  /**
   * true = this is timed by an external app or device (e.g. a fitness app,
   * a video, or the vibration plate itself), so the in-app countdown is hidden
   * and you just mark it done when finished.
   */
  externalTimer?: boolean
  /**
   * Rest between sets (for "sets" exercises) or override rest between rounds
   * (for "timed"). The rest countdown dings when it's time for the next set.
   * Defaults: 90s for sets, 10s between timed rounds.
   */
  restSeconds?: number
  /**
   * What to do during the rest — shown under the rest countdown. Keep each a
   * short line (e.g. "Sip some water", "Child's pose to release the low back").
   * Falls back to a sensible default when omitted.
   */
  restTips?: string[]
  /** How to warm up before this movement — shown above the timer/sets. */
  warmUp?: string[]
  /** How to cool down / what to stretch afterwards — shown below the work. */
  coolDown?: string[]
  /**
   * No-equipment substitute used in Travel mode. Overrides the given fields
   * (name, howTo, sets, etc.) while keeping the same id, category and emoji.
   */
  travel?: Partial<Exercise>
}

export interface Workout {
  id: string
  name: string
  description: string
  /** true -> show a computed total time; false -> show "Untimed" */
  timed: boolean
  exercises: Exercise[]
}

/** User settings, persisted to localStorage. */
export interface Settings {
  /** Bar weight, added automatically to every barbell lift. Default 8. */
  barWeightKg: number
  units: Units
  /** Optional targets shown as a goal line on the progress charts. */
  goalWeight?: number
  goalBodyFatPct?: number
  /** true = away from home, no equipment: use bodyweight substitutions. */
  travelMode?: boolean
}

/**
 * Last logged load for an exercise, keyed by exercise id and persisted so the
 * value pre-fills next session. Which fields are set depends on equipment.
 */
export interface ExerciseLog {
  equipment: Equipment
  units: Units
  /** barbell: plate weight entered (excludes the bar) */
  plates?: number
  /** barbell: plates + bar weight at the time it was logged */
  total?: number
  /** dumbbell: per-hand or single-dumbbell value */
  weight?: number
  /** bodyweight: rung / variation text */
  variation?: string
}

export interface LoggedWeight {
  exerciseName: string
  /** Pre-formatted for display, e.g. "22 kg" or "12 kg per hand" */
  weight: string
}

/** How a set of an exercise felt — a simple RPE-style effort rating. */
export type Effort = 'easy' | 'normal' | 'hard'

/**
 * The last effort rating for an exercise, with the load it was rated at, so the
 * next session can advise whether to go up, hold, or ease off. Keyed by id.
 */
export interface ExerciseEffort {
  rating: Effort
  dateISO: string
  /** Numeric working load in kg at the time (barbell total / dumbbell weight). */
  loadKg?: number
  /** Display label, e.g. "22 kg" or "12 kg per hand". */
  loadLabel?: string
}

/** The movement pattern a lift trains — used for the achievement breakdown. */
export type MovementPattern = 'Push' | 'Pull' | 'Legs' | 'Carry' | 'Core'

/**
 * A session's training tally, computed at save time so the home screen and
 * completion screen can show what was actually done (weight moved, by pattern).
 */
export interface SessionStats {
  /** Approx total weight moved this session (kg): sets × reps × load. */
  totalKg: number
  /** Weight moved split by movement pattern (kg). */
  byPattern: Partial<Record<MovementPattern, number>>
  /** How many working sets were completed. */
  sets: number
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
  /** Training tally for the session (present for sessions saved from v13 on). */
  stats?: SessionStats
}

/** Per-exercise progress captured during an active session. */
export interface ExerciseProgress {
  /** For "sets" exercises: how many sets have been filled */
  completedSets: number
  /** Marked done — by finishing the timer, filling all sets, or tapping "done" */
  done: boolean
  /** Raw numeric weight field as typed (plates or dumbbell), '' if none */
  entryNum: string
  /** Raw text field as typed (bodyweight rung / variation), '' if none */
  entryText: string
}

/**
 * A dated body measurement. `weight` is the primary field; the rest mirror what
 * a body-composition scale (e.g. Renpho) reports and are all optional, so an
 * entry can be just a weight or a full scale reading.
 */
export interface BodyEntry {
  id: string
  dateISO: string
  units: Units
  weight?: number
  bodyFatPct?: number
  muscleMassKg?: number
  bodyWaterPct?: number
  boneMassKg?: number
  bmi?: number
  visceralFat?: number
  proteinPct?: number
  bmrKcal?: number
  metabolicAge?: number
  skeletalMusclePct?: number
  fatFreeMassKg?: number
  subcutaneousFatPct?: number
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
