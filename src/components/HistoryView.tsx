import { useMemo, useState } from 'react'
import type { HistoryEntry } from '../types'
import { BackButton } from './ui'
import { ConfirmDialog } from './ConfirmDialog'
import { formatDate, formatElapsedShort, formatMonth } from '../lib/time'
import { computeStats } from '../lib/stats'

function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-3xl bg-white shadow-card ring-1 ring-ink-line/60 p-4 text-center">
      <p className="text-2xl font-extrabold text-accent-600">{value}</p>
      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
    </div>
  )
}

function TrashIcon() {
  return (
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
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  )
}

function groupByMonth(history: HistoryEntry[]): [string, HistoryEntry[]][] {
  const sorted = [...history].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime(),
  )
  const groups = new Map<string, HistoryEntry[]>()
  for (const h of sorted) {
    const key = formatMonth(h.dateISO)
    const arr = groups.get(key)
    if (arr) arr.push(h)
    else groups.set(key, [h])
  }
  return Array.from(groups.entries())
}

export function HistoryView({
  history,
  onBack,
  onDelete,
}: {
  history: HistoryEntry[]
  onBack: () => void
  onDelete: (id: string) => void
}) {
  const [pendingDelete, setPendingDelete] = useState<HistoryEntry | null>(null)
  const stats = useMemo(() => computeStats(history), [history])
  const groups = useMemo(() => groupByMonth(history), [history])

  return (
    <div className="mx-auto min-h-full max-w-md px-4 pb-16 pt-4 safe-top">
      <header className="mb-6 flex items-center gap-3">
        <BackButton onClick={onBack} />
        <h1 className="text-2xl font-semibold tracking-tight text-ink">History</h1>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <StatTile value={stats.thisWeek} label="This week" />
        <StatTile value={stats.thisMonth} label="This month" />
        <StatTile
          value={stats.streak === 1 ? '1 day' : `${stats.streak} days`}
          label="Streak"
        />
      </div>

      {history.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white shadow-card ring-1 ring-ink-line/60 p-6 text-center text-sm text-ink-faint">
          No sessions logged yet.
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {groups.map(([month, entries]) => (
            <section key={month}>
              <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-ink-faint">
                {month}
              </h2>
              <div className="space-y-2">
                {entries.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-3xl bg-white shadow-card ring-1 ring-ink-line/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-ink">{h.workoutName}</p>
                        <p className="text-xs text-ink-faint">
                          {formatDate(h.dateISO)} ·{' '}
                          {formatElapsedShort(h.elapsedSeconds)} ·{' '}
                          {h.completedExerciseCount} done
                        </p>
                      </div>
                      <button
                        onClick={() => setPendingDelete(h)}
                        aria-label="Delete entry"
                        className="shrink-0 rounded-xl bg-cream-200 p-2 text-ink-faint active:scale-95 active:text-rose-600"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                    {h.weights && h.weights.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t border-ink-line pt-3">
                        {h.weights.map((w, i) => (
                          <li
                            key={i}
                            className="flex justify-between gap-3 text-xs text-ink-soft"
                          >
                            <span className="truncate">{w.exerciseName}</span>
                            <span className="shrink-0 font-semibold text-ink-soft">
                              {w.weight}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this entry?"
        message="This history record will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id)
          setPendingDelete(null)
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
