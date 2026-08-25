import { useCallback, useEffect, useState } from 'react'
import type {
  ActiveSession,
  BodyEntry,
  ExerciseLog,
  HistoryEntry,
  Settings,
  Workout,
} from '../types'
import { SEED_VERSION, defaultSettings, seedWorkouts } from '../data/seed'
import { STORAGE_KEYS, loadJSON, removeKey, saveJSON } from './storage'

/**
 * Loads workouts from storage, seeding on first run and re-seeding when the
 * bundled SEED_VERSION is newer than what was stored. History is never touched.
 */
function initWorkouts(): Workout[] {
  const storedVersion = loadJSON<number>(STORAGE_KEYS.seedVersion, 0)
  const stored = loadJSON<Workout[] | null>(STORAGE_KEYS.workouts, null)
  if (!stored || storedVersion < SEED_VERSION) {
    saveJSON(STORAGE_KEYS.workouts, seedWorkouts)
    saveJSON(STORAGE_KEYS.seedVersion, SEED_VERSION)
    return seedWorkouts
  }
  return stored
}

export interface AppStore {
  workouts: Workout[]
  history: HistoryEntry[]
  formNoticeDismissed: boolean
  /** In-progress checklist per workout id, so each can be resumed independently. */
  sessions: Record<string, ActiveSession>
  settings: Settings
  exerciseLog: Record<string, ExerciseLog>
  loadNoteAcks: Record<string, boolean>
  bodyEntries: BodyEntry[]

  dismissFormNotice: () => void
  setSession: (session: ActiveSession) => void
  clearSession: (workoutId: string) => void
  addHistoryEntry: (entry: HistoryEntry) => void
  /** Record today's result, replacing an existing same-day entry for the workout. */
  upsertHistoryEntry: (entry: HistoryEntry) => void
  deleteHistoryEntry: (id: string) => void
  updateSettings: (partial: Partial<Settings>) => void
  recordExerciseLogs: (logs: Record<string, ExerciseLog>) => void
  ackLoadNote: (exerciseId: string) => void
  addBodyEntry: (entry: BodyEntry) => void
  deleteBodyEntry: (id: string) => void
}

export function useStore(): AppStore {
  const [workouts] = useState<Workout[]>(initWorkouts)
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    loadJSON<HistoryEntry[]>(STORAGE_KEYS.history, []),
  )
  const [formNoticeDismissed, setFormNoticeDismissed] = useState<boolean>(() =>
    loadJSON<boolean>(STORAGE_KEYS.formNoticeDismissed, false),
  )
  const [sessions, setSessions] = useState<Record<string, ActiveSession>>(() => {
    const map = loadJSON<Record<string, ActiveSession>>(STORAGE_KEYS.sessions, {})
    // One-time migration from the old single-session key.
    const legacy = loadJSON<ActiveSession | null>(STORAGE_KEYS.activeSession, null)
    if (legacy && !map[legacy.workoutId]) {
      map[legacy.workoutId] = legacy
      removeKey(STORAGE_KEYS.activeSession)
      saveJSON(STORAGE_KEYS.sessions, map)
    }
    return map
  })
  const [settings, setSettings] = useState<Settings>(() => ({
    ...defaultSettings,
    ...loadJSON<Partial<Settings>>(STORAGE_KEYS.settings, {}),
  }))
  const [exerciseLog, setExerciseLog] = useState<Record<string, ExerciseLog>>(
    () => loadJSON<Record<string, ExerciseLog>>(STORAGE_KEYS.exerciseLog, {}),
  )
  const [loadNoteAcks, setLoadNoteAcks] = useState<Record<string, boolean>>(() =>
    loadJSON<Record<string, boolean>>(STORAGE_KEYS.loadNoteAcks, {}),
  )
  const [bodyEntries, setBodyEntries] = useState<BodyEntry[]>(() =>
    loadJSON<BodyEntry[]>(STORAGE_KEYS.bodyEntries, []),
  )

  // Persist history whenever it changes.
  useEffect(() => {
    saveJSON(STORAGE_KEYS.history, history)
  }, [history])

  // Persist body measurements whenever they change.
  useEffect(() => {
    saveJSON(STORAGE_KEYS.bodyEntries, bodyEntries)
  }, [bodyEntries])

  const dismissFormNotice = useCallback(() => {
    setFormNoticeDismissed(true)
    saveJSON(STORAGE_KEYS.formNoticeDismissed, true)
  }, [])

  const setSession = useCallback((session: ActiveSession) => {
    setSessions((prev) => {
      const next = { ...prev, [session.workoutId]: session }
      saveJSON(STORAGE_KEYS.sessions, next)
      return next
    })
  }, [])

  const clearSession = useCallback((workoutId: string) => {
    setSessions((prev) => {
      if (!(workoutId in prev)) return prev
      const next = { ...prev }
      delete next[workoutId]
      saveJSON(STORAGE_KEYS.sessions, next)
      return next
    })
  }, [])

  const addHistoryEntry = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => [entry, ...prev])
  }, [])

  const upsertHistoryEntry = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => {
      // One entry per workout per day: if today's already recorded, replace it
      // (keeping its id) so repeated saves don't pile up duplicates.
      const day = entry.dateISO.slice(0, 10)
      const idx = prev.findIndex(
        (h) => h.workoutId === entry.workoutId && h.dateISO.slice(0, 10) === day,
      )
      if (idx === -1) return [entry, ...prev]
      const next = [...prev]
      next[idx] = { ...entry, id: prev[idx].id }
      return next
    })
  }, [])

  const deleteHistoryEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      saveJSON(STORAGE_KEYS.settings, next)
      return next
    })
  }, [])

  const recordExerciseLogs = useCallback(
    (logs: Record<string, ExerciseLog>) => {
      setExerciseLog((prev) => {
        const next = { ...prev, ...logs }
        saveJSON(STORAGE_KEYS.exerciseLog, next)
        return next
      })
    },
    [],
  )

  const ackLoadNote = useCallback((exerciseId: string) => {
    setLoadNoteAcks((prev) => {
      if (prev[exerciseId]) return prev
      const next = { ...prev, [exerciseId]: true }
      saveJSON(STORAGE_KEYS.loadNoteAcks, next)
      return next
    })
  }, [])

  const addBodyEntry = useCallback((entry: BodyEntry) => {
    setBodyEntries((prev) =>
      [entry, ...prev].sort(
        (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime(),
      ),
    )
  }, [])

  const deleteBodyEntry = useCallback((id: string) => {
    setBodyEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return {
    workouts,
    history,
    formNoticeDismissed,
    sessions,
    settings,
    exerciseLog,
    loadNoteAcks,
    dismissFormNotice,
    setSession,
    clearSession,
    addHistoryEntry,
    upsertHistoryEntry,
    deleteHistoryEntry,
    updateSettings,
    recordExerciseLogs,
    ackLoadNote,
    bodyEntries,
    addBodyEntry,
    deleteBodyEntry,
  }
}
