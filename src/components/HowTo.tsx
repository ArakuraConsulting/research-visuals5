import { useState } from 'react'

/**
 * "How to do it" — beginner-friendly steps explaining the movement.
 * Collapsible, open by default so it's visible without a tap.
 */
export function HowTo({ steps }: { steps: string[] }) {
  const [open, setOpen] = useState(true)
  if (steps.length === 0) return null
  return (
    <div className="rounded-3xl border border-accent-500/20 bg-accent-500/[0.07]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent-600">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          How to do it
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-accent-600 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ol className="space-y-2 px-4 pb-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
