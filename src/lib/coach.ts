import type { Effort, Exercise, ExerciseEffort, ExerciseLog } from '../types'
import { lastTimeLabel } from './equipment'

/**
 * Weight-progression coaching for the effort check-in.
 *
 * Tuned for building strength for health at a sensible pace (not maxing out):
 * small, conservative increments, and gentle language. Bodyweight moves get
 * rep/tempo advice instead of a weight change.
 */

/** Smallest sensible jump for this exercise, in kg. 0 = not a loaded lift. */
export function incrementKg(ex: Exercise): number {
  if (ex.equipment === 'barbell') return 1
  if (ex.equipment === 'dumbbell') return 1
  return 0
}

/** Numeric working load (kg) from a log — barbell total or dumbbell weight. */
export function logLoadKg(log: ExerciseLog | null | undefined): number | null {
  if (!log) return null
  if (log.equipment === 'barbell') return log.total ?? null
  if (log.equipment === 'dumbbell') return log.weight ?? null
  return null
}

/** Trim a weight to a tidy string: 13, 12.5. */
function fmt(n: number): string {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

function perHandSuffix(ex: Exercise): string {
  return ex.equipment === 'dumbbell' && ex.perHand ? ' per hand' : ''
}

export interface Advice {
  tone: 'up' | 'hold' | 'down'
  text: string
}

/** Advice shown right after you rate the set you just finished. */
export function adviceForRating(
  ex: Exercise,
  rating: Effort,
  liveLog: ExerciseLog | null,
): Advice {
  const inc = incrementKg(ex)
  const load = logLoadKg(liveLog)
  const suffix = perHandSuffix(ex)
  const loaded = inc > 0 && load != null

  if (rating === 'easy') {
    return {
      tone: 'up',
      text: loaded
        ? `Comfortable — good sign you can progress. Next time, try about ${fmt(load! + inc)} kg${suffix} (up ~${inc} kg).`
        : `Comfortable — next time add a couple of reps, or slow the lowering to about 3 seconds to make it harder.`,
    }
  }
  if (rating === 'hard') {
    return {
      tone: 'down',
      text: loaded
        ? `That was a real effort. If your form held, keep this weight and it will get easier; if it slipped, ease to about ${fmt(Math.max(0, load! - inc))} kg${suffix} next time.`
        : `That was a real effort. Next time do the lower end of the rep range, or an easier variation — no rush.`,
    }
  }
  return {
    tone: 'hold',
    text: `Right in the sweet spot. Stay here — once it feels easy two sessions running, nudge up ~${inc || 1} kg.`,
  }
}

export interface CoachNote {
  headline: string
  detail: string
}

/**
 * The note shown at the top of the exercise on a later session, based on how
 * last time felt and the load it was at.
 */
export function nextSessionNote(
  ex: Exercise,
  last: ExerciseEffort | undefined,
): CoachNote | null {
  if (!last) return null
  const inc = incrementKg(ex)
  const load = last.loadKg
  const suffix = perHandSuffix(ex)
  const at = last.loadLabel ? ` at ${last.loadLabel}` : ''
  const loaded = inc > 0 && load != null

  if (last.rating === 'easy') {
    return {
      headline: `Last time felt easy${at}.`,
      detail: loaded
        ? `Try about ${fmt(load! + inc)} kg${suffix} today (up ~${inc} kg).`
        : `Make it a little harder today — a few more reps or a tougher variation.`,
    }
  }
  if (last.rating === 'hard') {
    return {
      headline: `Last time was tough${at}.`,
      detail: loaded
        ? `Ease to about ${fmt(Math.max(0, load! - inc))} kg${suffix} today, or repeat and focus on clean form.`
        : `Take the lower end of the reps today, or an easier variation.`,
    }
  }
  return {
    headline: `Last time felt just right${at}.`,
    detail: last.loadLabel
      ? `Repeat ${last.loadLabel} — aim for the same or one more rep.`
      : `Repeat the same and aim for one more rep.`,
  }
}

/** Build an effort record from the live log at rating time. */
export function makeEffort(
  ex: Exercise,
  rating: Effort,
  liveLog: ExerciseLog | null,
  dateISO: string,
): ExerciseEffort {
  const loadKg = logLoadKg(liveLog)
  return {
    rating,
    dateISO,
    loadKg: loadKg ?? undefined,
    loadLabel: liveLog ? lastTimeLabel(liveLog, ex) : undefined,
  }
}
