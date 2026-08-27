const NOTICE_TEXT = `These form notes are general guidance, not personal coaching. They do not replace having your technique checked in person, which is worth doing for the deadlift, the overhead press and the wall walk in particular. Stop any movement that produces sharp pain, and check with a doctor before starting if you have any joint, back or bone density history.`

/** Full-screen dismissible notice shown once on first launch. */
export function FormNoticeModal({
  onDismiss,
  onOpenGuide,
}: {
  onDismiss: () => void
  onOpenGuide: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 safe-top safe-bottom"
      role="dialog"
      aria-modal="true"
      aria-label="Form and safety notice"
    >
      <div className="w-full max-w-md rounded-3xl bg-cream-200 p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2 text-accent-600">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          <h2 className="text-lg font-bold text-ink">Before you start</h2>
        </div>
        <p className="text-sm leading-relaxed text-ink-soft">{NOTICE_TEXT}</p>
        <button
          onClick={onDismiss}
          className="mt-6 w-full rounded-2xl bg-accent-500 px-6 py-4 text-base font-semibold text-white active:scale-[0.98]"
        >
          Got it
        </button>
        <button
          onClick={onOpenGuide}
          className="mt-3 w-full text-sm font-semibold text-accent-600 underline underline-offset-4 active:text-accent-600"
        >
          New to this? Read “Finding your weight”
        </button>
      </div>
    </div>
  )
}

/** Reachable-again version, opened from the small home-screen link. */
export function FormNoticeSheet({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 safe-bottom sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Form and safety notice"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-cream-200 p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-ink">Form &amp; safety notice</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {NOTICE_TEXT}
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-accent-500 px-6 py-4 text-base font-semibold text-white active:scale-[0.98]"
        >
          Close
        </button>
      </div>
    </div>
  )
}
