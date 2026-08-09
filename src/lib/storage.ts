/**
 * Thin, crash-safe wrapper around localStorage.
 *
 * Every access is guarded: if storage is unavailable (private mode, disabled)
 * or full (quota exceeded), reads return a fallback and writes are swallowed,
 * so the app keeps working purely in memory rather than throwing.
 */

let warnedUnavailable = false

function storageAvailable(): boolean {
  try {
    const t = '__wt_test__'
    window.localStorage.setItem(t, t)
    window.localStorage.removeItem(t)
    return true
  } catch {
    if (!warnedUnavailable) {
      warnedUnavailable = true
      // eslint-disable-next-line no-console
      console.warn(
        'localStorage is unavailable. The app will run without saving between sessions.',
      )
    }
    return false
  }
}

export function loadJSON<T>(key: string, fallback: T): T {
  if (!storageAvailable()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Returns true if the write succeeded. */
export function saveJSON(key: string, value: unknown): boolean {
  if (!storageAvailable()) return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    // QuotaExceededError or similar — degrade gracefully.
    // eslint-disable-next-line no-console
    console.warn(`Could not persist "${key}":`, err)
    return false
  }
}

export function removeKey(key: string): void {
  if (!storageAvailable()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  workouts: 'wt.workouts',
  seedVersion: 'wt.seedVersion',
  history: 'wt.history',
  formNoticeDismissed: 'wt.formNoticeDismissed',
  activeSession: 'wt.activeSession',
  settings: 'wt.settings',
  exerciseLog: 'wt.exerciseLog',
  loadNoteAcks: 'wt.loadNoteAcks',
  bodyEntries: 'wt.bodyEntries',
} as const
