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
  activeSession: ActiveSession | null
  settings: Settings
  exerciseLog: Record<string, ExerciseLog>
  loadNoteAcks: Record<string, boolean>
  bodyEntries: BodyEntry[]

  dismissFormNotice: () => void
  setActiveSession: (session: ActiveSession | null) => void
  addHistoryEntry: (entry: HistoryEntry) => void
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
  const [activeSession, setActiveSessionState] = useState<ActiveSession | null>(
    () => loadJSON<ActiveSession | null>(STORAGE_KEYS.activeSession, null),
  )
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

  const setActiveSession = useCallback((session: ActiveSession | null) => {
    setActiveSessionState(session)
    if (session) {
      saveJSON(STORAGE_KEYS.activeSession, session)
    } else {
      removeKey(STORAGE_KEYS.activeSession)
    }
  }, [])

  const addHistoryEntry = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => [entry, ...prev])
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
    activeSession,
    settings,
    exerciseLog,
    loadNoteAcks,
    dismissFormNotice,
    setActiveSession,
    addHistoryEntry,
    deleteHistoryEntry,
    updateSettings,
    recordExerciseLogs,
    ackLoadNote,
    bodyEntries,
    addBodyEntry,
    deleteBodyEntry,
  }
}
