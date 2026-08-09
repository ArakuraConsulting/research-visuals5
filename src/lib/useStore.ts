import { useCallback, useEffect, useState } from 'react'
import type { ActiveSession, HistoryEntry, Workout } from '../types'
import { SEED_VERSION, seedWorkouts } from '../data/seed'
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

  dismissFormNotice: () => void
  setActiveSession: (session: ActiveSession | null) => void
  addHistoryEntry: (entry: HistoryEntry) => void
  deleteHistoryEntry: (id: string) => void
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

  // Persist history whenever it changes.
  useEffect(() => {
    saveJSON(STORAGE_KEYS.history, history)
  }, [history])

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

  return {
    workouts,
    history,
    formNoticeDismissed,
    activeSession,
    dismissFormNotice,
    setActiveSession,
    addHistoryEntry,
    deleteHistoryEntry,
  }
}
