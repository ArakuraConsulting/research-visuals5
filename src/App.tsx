import { useMemo, useState } from 'react'
import type { ActiveSession, ExerciseLog, HistoryEntry } from './types'
import { useStore } from './lib/useStore'
import { primeAudio } from './lib/feedback'
import { doneCountFor } from './lib/session'
import { isSameDay } from './lib/time'
import { resolveWorkout } from './lib/travel'
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

  const travelMode = !!store.settings.travelMode
  // In Travel mode, swap each exercise for its no-equipment substitute.
  const workouts = useMemo(
    () => store.workouts.map((w) => resolveWorkout(w, travelMode)),
    [store.workouts, travelMode],
  )

  const activeWorkout =
    currentWorkoutId != null
      ? workouts.find((w) => w.id === currentWorkoutId) ?? null
      : null
  const activeSession =
    currentWorkoutId != null ? store.sessions[currentWorkoutId] ?? null : null

  // Per-workout done/total for the home cards.
  const progressByWorkout = useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {}
    for (const w of workouts) {
      const s = store.sessions[w.id]
      if (s) map[w.id] = { done: doneCountFor(w, s.progress), total: w.exercises.length }
    }
    return map
  }, [workouts, store.sessions])

  // Open a workout straight into its checklist. Resume today's saved progress
  // if there is any; only start fresh when there's no session or it's from a
  // previous day (yesterday's result is already saved to history).
  const openWorkout = (id: string) => {
    const workout = workouts.find((w) => w.id === id)
    if (!workout) return
    primeAudio() // unlock audio from this user gesture (iOS)
    const existing = store.sessions[id]
    const resumable = existing && isSameDay(existing.dateISO, new Date().toISOString())
    if (!resumable) {
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

  // Save the session: record today's result to history/progress but KEEP the
  // checklist so you can reopen it and tick off anything you missed. Repeated
  // saves in a day update the same entry rather than duplicating it. The
  // session is only cleared by "End & discard" or replaced on a new day.
  const finishActive = (
    entry: HistoryEntry,
    logs: Record<string, ExerciseLog>,
  ) => {
    store.recordExerciseLogs(logs)
    store.upsertHistoryEntry(entry)
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
          workouts={workouts}
          history={store.history}
          exerciseLog={store.exerciseLog}
          progressByWorkout={progressByWorkout}
          travelMode={travelMode}
          onToggleTravel={(on) => store.updateSettings({ travelMode: on })}
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
          effortLog={store.effortLog}
          loadNoteAcks={store.loadNoteAcks}
          onAckLoadNote={store.ackLoadNote}
          onRecordEffort={store.recordEffort}
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
