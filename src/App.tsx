import { useMemo, useState } from 'react'
import type { ActiveSession, ExerciseLog, HistoryEntry } from './types'
import { useStore } from './lib/useStore'
import { primeAudio } from './lib/feedback'
import { doneCountFor } from './lib/session'
import { HomeView } from './components/HomeView'
import { ActiveWorkout } from './components/ActiveWorkout'
import { HistoryView } from './components/HistoryView'
import { ProgressView } from './components/ProgressView'
import { SettingsView } from './components/SettingsView'
import { GuideView } from './components/GuideView'
import { FormNoticeModal, FormNoticeSheet } from './components/FormNotice'

type View = 'home' | 'active' | 'history' | 'progress' | 'settings' | 'guide'

export default function App() {
  const store = useStore()
  const [view, setView] = useState<View>('home')
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(null)
  const [showNoticeSheet, setShowNoticeSheet] = useState(false)
  const [guideReturn, setGuideReturn] = useState<View>('home')

  const activeWorkout =
    currentWorkoutId != null
      ? store.workouts.find((w) => w.id === currentWorkoutId) ?? null
      : null
  const activeSession =
    currentWorkoutId != null ? store.sessions[currentWorkoutId] ?? null : null

  // Per-workout done/total for the home cards.
  const progressByWorkout = useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {}
    for (const w of store.workouts) {
      const s = store.sessions[w.id]
      if (s) map[w.id] = { done: doneCountFor(w, s.progress), total: w.exercises.length }
    }
    return map
  }, [store.workouts, store.sessions])

  // Open a workout straight into its checklist, creating a session if needed.
  const openWorkout = (id: string) => {
    const workout = store.workouts.find((w) => w.id === id)
    if (!workout) return
    primeAudio() // unlock audio from this user gesture (iOS)
    if (!store.sessions[id]) {
      const session: ActiveSession = {
        workoutId: id,
        workoutName: workout.name,
        startedAt: Date.now(),
        dateISO: new Date().toISOString(),
        currentIndex: 0,
        progress: {},
      }
      store.setSession(session)
    }
    setCurrentWorkoutId(id)
    setView('active')
  }

  // Leave the checklist, keeping its progress to resume later.
  const goHomeKeepSession = () => setView('home')

  const discardActive = () => {
    if (currentWorkoutId) store.clearSession(currentWorkoutId)
    setView('home')
  }

  const finishActive = (
    entry: HistoryEntry,
    logs: Record<string, ExerciseLog>,
  ) => {
    store.recordExerciseLogs(logs)
    store.addHistoryEntry(entry)
    if (currentWorkoutId) store.clearSession(currentWorkoutId)
    setView('home')
  }

  const openGuide = (from: View) => {
    setGuideReturn(from)
    setView('guide')
  }

  const showFirstRunNotice = !store.formNoticeDismissed && view !== 'guide'

  return (
    <div className="min-h-full">
      {view === 'home' && (
        <HomeView
          workouts={store.workouts}
          history={store.history}
          progressByWorkout={progressByWorkout}
          onOpenWorkout={openWorkout}
          onOpenHistory={() => setView('history')}
          onOpenProgress={() => setView('progress')}
          onOpenNotice={() => setShowNoticeSheet(true)}
          onOpenSettings={() => setView('settings')}
          onOpenGuide={() => openGuide('home')}
        />
      )}

      {view === 'active' && activeSession && activeWorkout && (
        <ActiveWorkout
          workout={activeWorkout}
          session={activeSession}
          settings={store.settings}
          exerciseLog={store.exerciseLog}
          loadNoteAcks={store.loadNoteAcks}
          onAckLoadNote={store.ackLoadNote}
          onChange={(s) => store.setSession(s)}
          onHome={goHomeKeepSession}
          onDiscard={discardActive}
          onFinish={finishActive}
        />
      )}

      {view === 'active' && !(activeSession && activeWorkout) && (
        <FallbackHome onGoHome={() => setView('home')} />
      )}

      {view === 'history' && (
        <HistoryView
          history={store.history}
          onBack={() => setView('home')}
          onDelete={store.deleteHistoryEntry}
        />
      )}

      {view === 'progress' && (
        <ProgressView
          history={store.history}
          bodyEntries={store.bodyEntries}
          settings={store.settings}
          onBack={() => setView('home')}
          onAddBody={store.addBodyEntry}
          onDeleteBody={store.deleteBodyEntry}
        />
      )}

      {view === 'settings' && (
        <SettingsView
          settings={store.settings}
          onBack={() => setView('home')}
          onUpdate={store.updateSettings}
        />
      )}

      {view === 'guide' && <GuideView onBack={() => setView(guideReturn)} />}

      {showFirstRunNotice && (
        <FormNoticeModal
          onDismiss={store.dismissFormNotice}
          onOpenGuide={() => openGuide('home')}
        />
      )}

      {showNoticeSheet && (
        <FormNoticeSheet onClose={() => setShowNoticeSheet(false)} />
      )}
    </div>
  )
}

function FallbackHome({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-white/60">This workout could not be loaded.</p>
      <button
        onClick={onGoHome}
        className="rounded-2xl bg-accent-500 px-6 py-3 font-semibold text-white"
      >
        Back to workouts
      </button>
    </div>
  )
}
