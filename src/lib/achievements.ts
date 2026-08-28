import type {
  Exercise,
  ExerciseLog,
  ExerciseProgress,
  HistoryEntry,
  MovementPattern,
  SessionStats,
  Workout,
} from '../types'
import { lastTimeLabel } from './equipment'
import { logLoadKg } from './coach'

/**
 * Achievements & benchmarking.
 *
 * Turns the loads logged during a session into a simple "weight moved" tally,
 * split by movement pattern (Push / Pull / Legs / Carry), plus weekly totals
 * and the current working load per lift — so the home screen shows progress
 * building up over the week instead of resetting to zero each day.
 */

const DAY_MS = 24 * 60 * 60 * 1000

/** Which movement pattern each exercise trains. */
const PATTERN_BY_ID: Record<string, MovementPattern> = {
  'sa-overhead-press': 'Push',
  'sa-pike-push-up': 'Push',
  'dp-push-up': 'Push',
  'sa-pull-up': 'Pull',
  'sa-dumbbell-row': 'Pull',
  'sb-goblet-squat': 'Legs',
  'sb-romanian-deadlift': 'Legs',
  'sb-hip-thrust': 'Legs',
  'dp-wall-sit': 'Legs',
  'sb-farmers-carry': 'Carry',
  'dp-hollow-hold': 'Core',
  'dp-dead-hang': 'Core',
  'sb-wall-walk': 'Core',
  'sb-shoulder-taps': 'Core',
}

/** Order patterns are shown in. */
export const PATTERN_ORDER: MovementPattern[] = [
  'Push',
  'Pull',
  'Legs',
  'Carry',
  'Core',
]

export function patternFor(ex: Exercise): MovementPattern | null {
  return PATTERN_BY_ID[ex.id] ?? null
}

/**
 * Approximate reps per set from a rep-range string. "6-8" → 7, "10-15" → 12.5.
 * "8 reps each side" counts both sides → 16.
 */
export function midReps(repRange?: string): number {
  if (!repRange) return 1
  const nums = (repRange.match(/\d+(?:\.\d+)?/g) ?? []).map(Number)
  if (nums.length === 0) return 1
  const base = nums.length >= 2 ? (nums[0] + nums[1]) / 2 : nums[0]
  const eachSide = /each|per side/i.test(repRange)
  return eachSide ? base * 2 : base
}

/** Approx kg moved for one loaded exercise in a session. 0 for bodyweight. */
function exerciseVolumeKg(ex: Exercise, log: ExerciseLog | null): number {
  const load = logLoadKg(log)
  if (load == null || load <= 0) return 0
  if (ex.type === 'sets') {
    // "each side" is already folded into midReps; load is the weight moved
    // each rep (bar total, or a single dumbbell's weight).
    return load * Math.max(1, ex.sets ?? 1) * midReps(ex.repRange)
  }
  // Timed loaded carry: what you hold in both hands, per round.
  const hands = ex.equipment === 'dumbbell' && ex.perHand ? 2 : 1
  return load * hands * Math.max(1, ex.rounds ?? 1)
}

/** Is this exercise complete in the given progress? */
function exerciseDone(ex: Exercise, p: ExerciseProgress | undefined): boolean {
  if (!p) return false
  if (p.done) return true
  return ex.type === 'sets' && p.completedSets >= (ex.sets ?? 1)
}

/**
 * Tally a session from its completed exercises and the loads logged for them.
 * `logs` are the freshly built logs for this session (id → log).
 */
export function computeSessionStats(
  workout: Workout,
  progress: Record<string, ExerciseProgress>,
  logs: Record<string, ExerciseLog>,
): SessionStats {
  let totalKg = 0
  let sets = 0
  const byPattern: Partial<Record<MovementPattern, number>> = {}
  for (const ex of workout.exercises) {
    const p = progress[ex.id]
    if (!exerciseDone(ex, p)) continue
    if (ex.type === 'sets') sets += p?.completedSets || (ex.sets ?? 0)
    const vol = exerciseVolumeKg(ex, logs[ex.id] ?? null)
    if (vol > 0) {
      totalKg += vol
      const pat = patternFor(ex)
      if (pat) byPattern[pat] = (byPattern[pat] ?? 0) + vol
    }
  }
  // Round to the nearest 5 kg — this is an estimate, not a precise figure.
  const round5 = (n: number) => Math.round(n / 5) * 5
  const rounded: Partial<Record<MovementPattern, number>> = {}
  for (const k of Object.keys(byPattern) as MovementPattern[]) {
    rounded[k] = round5(byPattern[k]!)
  }
  return { totalKg: round5(totalKg), byPattern: rounded, sets }
}

export interface WeekTotals {
  sessions: number
  seconds: number
  kg: number
  /** Distinct calendar days trained in the last 7 days. */
  days: number
}

/** Totals across sessions in the last 7 days. */
export function weekTotals(
  history: HistoryEntry[],
  nowMs = Date.now(),
): WeekTotals {
  const weekAgo = nowMs - 7 * DAY_MS
  let sessions = 0
  let seconds = 0
  let kg = 0
  const days = new Set<number>()
  for (const h of history) {
    const t = new Date(h.dateISO).getTime()
    if (Number.isNaN(t) || t < weekAgo) continue
    sessions += 1
    seconds += h.elapsedSeconds
    kg += h.stats?.totalKg ?? 0
    const d = new Date(t)
    days.add(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime())
  }
  return { sessions, seconds, kg, days: days.size }
}

export interface LoadRow {
  id: string
  name: string
  pattern: MovementPattern
  /** e.g. "22 kg" or "12 kg per hand". */
  label: string
}

/**
 * The current working load for each loaded lift that has ever been logged, in
 * pattern order — the benchmark of where she's at right now.
 */
export function currentLoads(
  workouts: Workout[],
  exerciseLog: Record<string, ExerciseLog>,
): LoadRow[] {
  const rows: LoadRow[] = []
  const seen = new Set<string>()
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (seen.has(ex.id)) continue
      const log = exerciseLog[ex.id]
      if (!log) continue
      if (logLoadKg(log) == null) continue
      const pattern = patternFor(ex)
      if (!pattern) continue
      seen.add(ex.id)
      rows.push({ id: ex.id, name: ex.name, pattern, label: lastTimeLabel(log, ex) })
    }
  }
  return rows.sort(
    (a, b) => PATTERN_ORDER.indexOf(a.pattern) - PATTERN_ORDER.indexOf(b.pattern),
  )
}
