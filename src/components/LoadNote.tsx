import { useState } from 'react'

function WarnIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

/**
 * Equipment-specific loading warning. On first use it shows expanded with a
 * "Got it" acknowledgement; once acked it collapses to a tappable pill so the
 * note stays reachable without nagging.
 */
export function LoadNote({
  points,
  acked,
  onAck,
}: {
  points: string[]
  acked: boolean
  onAck: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const showFull = !acked || expanded

  if (!showFull) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 rounded-2xl bg-amber-500/12 px-4 py-2.5 text-sm font-semibold text-amber-700 active:scale-[0.98]"
      >
        <WarnIcon />
        Loading &amp; clearance note
      </button>
    )
  }

  return (
    <div className="rounded-3xl border border-amber-400/30 bg-amber-500/12 p-4">
      <div className="mb-2 flex items-center gap-2 text-amber-700">
        <WarnIcon />
        <h3 className="text-sm font-bold uppercase tracking-wide">
          Clearance &amp; loading check
        </h3>
      </div>
      <ul className="space-y-2">
        {points.map((p, i) => (
          <li
            key={i}
            className="flex gap-2 text-sm leading-relaxed text-amber-800"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      {!acked ? (
        <button
          onClick={onAck}
          className="mt-4 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white active:scale-[0.98]"
        >
          Got it
        </button>
      ) : (
        <button
          onClick={() => setExpanded(false)}
          className="mt-3 text-sm font-semibold text-amber-700 active:text-amber-700"
        >
          Collapse
        </button>
      )}
    </div>
  )
}
