import { useState } from 'react'
import type { ActiveSession, ExerciseLog, HistoryEntry } from './types'
import { useStore } from './lib/useStore'
import { primeAudio } from './lib/feedback'
import { HomeView } from './components/HomeView'
import { DetailView } from './components/DetailView'
import { ActiveWorkout } from './components/ActiveWorkout'
import { HistoryView } from './components/HistoryView'
import { SettingsView } from './components/SettingsView'
import { GuideView } from './components/GuideView'
import { FormNoticeModal, FormNoticeSheet } from './components/FormNotice'
import { ConfirmDialog } from './components/ConfirmDialog'

type View = 'home' | 'detail' | 'active' | 'history' | 'settings' | 'guide'

export default function App() {
  const store = useStore()
  const [view, setView] = useState<View>('home')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNoticeSheet, setShowNoticeSheet] = useState(false)
  // Where "back" returns to from the guide (home or the first-run notice).
  const [guideReturn, setGuideReturn] = useState<View>('home')
  // Offer to resume a session that was in progress at load time.
  const [resumeCandidate, setResumeCandidate] = useState<ActiveSession | null>(
    () => store.activeSession,
  )

  const selectedWorkout = store.workouts.find((w) => w.id === selectedId) ?? null
  const activeWorkout = store.activeSession
    ? store.workouts.find((w) => w.id === store.activeSession!.workoutId) ?? null
    : null

  const openWorkout = (id: string) => {
    setSelectedId(id)
    setView('detail')
  }

  const startWorkout = () => {
    if (!selectedWorkout) return
    primeAudio() // unlock audio from this user gesture (iOS)
    const nowIso = new Date().toISOString()
    const session: ActiveSession = {
      workoutId: selectedWorkout.id,
      workoutName: selectedWorkout.name,
      startedAt: Date.now(),
      dateISO: nowIso,
      currentIndex: 0,
      progress: {},
    }
    store.setActiveSession(session)
    setResumeCandidate(null)
    setView('active')
  }

  const discardActive = () => {
    store.setActiveSession(null)
    setResumeCandidate(null)
    setView('home')
  }

  const finishActive = (
    entry: HistoryEntry,
    logs: Record<string, ExerciseLog>,
  ) => {
    store.recordExerciseLogs(logs)
    store.addHistoryEntry(entry)
    store.setActiveSession(null)
    setResumeCandidate(null)
    setView('home')
  }

  const resumeSession = () => {
    setResumeCandidate(null)
    setView('active')
  }

  const declineResume = () => {
    store.setActiveSession(null)
    setResumeCandidate(null)
  }

  const openGuide = (from: View) => {
    setGuideReturn(from)
    setView('guide')
  }

  // First-launch safety notice takes over the screen until dismissed.
  const showFirstRunNotice = !store.formNoticeDismissed && view !== 'guide'

  return (
    <div className="min-h-full">
      {view === 'home' && (
        <HomeView
          workouts={store.workouts}
          history={store.history}
          onOpenWorkout={openWorkout}
          onOpenHistory={() => setView('history')}
          onOpenNotice={() => setShowNoticeSheet(true)}
          onOpenSettings={() => setView('settings')}
          onOpenGuide={() => openGuide('home')}
        />
      )}

      {view === 'detail' && selectedWorkout && (
        <DetailView
          workout={selectedWorkout}
          onBack={() => setView('home')}
          onStart={startWorkout}
        />
      )}

      {view === 'active' && store.activeSession && activeWorkout && (
        <ActiveWorkout
          workout={activeWorkout}
          session={store.activeSession}
          settings={store.settings}
          exerciseLog={store.exerciseLog}
          loadNoteAcks={store.loadNoteAcks}
          onAckLoadNote={store.ackLoadNote}
          onChange={(s) => store.setActiveSession(s)}
          onDiscard={discardActive}
          onFinish={finishActive}
        />
      )}

      {/* Guard: active view with no valid session/workout falls back home. */}
      {view === 'active' && !(store.activeSession && activeWorkout) && (
        <FallbackHome onGoHome={() => setView('home')} />
      )}

      {view === 'history' && (
        <HistoryView
          history={store.history}
          onBack={() => setView('home')}
          onDelete={store.deleteHistoryEntry}
        />
      )}

      {view === 'settings' && (
        <SettingsView
          settings={store.settings}
          onBack={() => setView('home')}
          onUpdate={store.updateSettings}
        />
      )}

      {view === 'guide' && (
        <GuideView onBack={() => setView(guideReturn)} />
      )}

      {showFirstRunNotice && (
        <FormNoticeModal
          onDismiss={store.dismissFormNotice}
          onOpenGuide={() => openGuide('home')}
        />
      )}

      {showNoticeSheet && (
        <FormNoticeSheet onClose={() => setShowNoticeSheet(false)} />
      )}

      {/* Resume prompt — only on the home screen, once per load. */}
      <ConfirmDialog
        open={
          view === 'home' &&
          !showFirstRunNotice &&
          resumeCandidate !== null &&
          store.activeSession !== null
        }
        title="Resume workout?"
        message={
          <>
            You have an unfinished session
            {resumeCandidate ? (
              <>
                {' '}
                for{' '}
                <span className="font-semibold text-white">
                  {resumeCandidate.workoutName}
                </span>
              </>
            ) : null}
            . Pick up where you left off?
          </>
        }
        confirmLabel="Resume"
        cancelLabel="Discard"
        onConfirm={resumeSession}
        onCancel={declineResume}
      />
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
