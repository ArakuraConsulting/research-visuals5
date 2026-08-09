import { STORAGE_KEYS } from './storage'

/**
 * Backup / restore of all app data (workouts, history, body measurements,
 * settings, exercise logs). Used to move data between the Safari tab and the
 * installed home-screen app — which can have separate storage on iOS — and as
 * a general safeguard against the browser clearing site data.
 */

export interface BackupFile {
  app: 'workout-tracker'
  version: number
  exportedAt: string
  data: Record<string, string>
}

export function buildBackup(): BackupFile {
  const data: Record<string, string> = {}
  try {
    for (const key of Object.values(STORAGE_KEYS)) {
      const raw = window.localStorage.getItem(key)
      if (raw != null) data[key] = raw
    }
  } catch {
    /* storage unavailable — return whatever we have */
  }
  return {
    app: 'workout-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function backupToString(): string {
  return JSON.stringify(buildBackup(), null, 2)
}

export interface RestoreResult {
  ok: boolean
  error?: string
  restoredKeys?: number
}

export function restoreFromString(text: string): RestoreResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That text isn’t a readable backup.' }
  }
  const obj = parsed as Partial<BackupFile>
  if (!obj || obj.app !== 'workout-tracker' || typeof obj.data !== 'object') {
    return { ok: false, error: 'That isn’t a Workout Tracker backup.' }
  }
  const valid = new Set<string>(Object.values(STORAGE_KEYS))
  let count = 0
  try {
    for (const [key, val] of Object.entries(obj.data as Record<string, unknown>)) {
      if (valid.has(key) && typeof val === 'string') {
        window.localStorage.setItem(key, val)
        count += 1
      }
    }
  } catch {
    return { ok: false, error: 'Could not save the data — storage may be full.' }
  }
  if (count === 0) return { ok: false, error: 'The backup had no data to restore.' }
  return { ok: true, restoredKeys: count }
}

/** Trigger a file download of the backup (works on desktop; iOS may open it). */
export function downloadBackup(): void {
  try {
    const blob = new Blob([backupToString()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workout-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch {
    /* ignore */
  }
}

/** Copy the backup text to the clipboard. Returns whether it succeeded. */
export async function copyBackup(): Promise<boolean> {
  const text = backupToString()
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
