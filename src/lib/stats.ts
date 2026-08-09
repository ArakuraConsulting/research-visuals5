import type { HistoryEntry } from '../types'

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

const DAY_MS = 24 * 60 * 60 * 1000

export interface HistoryStats {
  thisWeek: number
  thisMonth: number
  streak: number
}

/**
 * Sessions in the last 7 days, sessions in the current calendar month, and the
 * current streak: consecutive days (ending today or yesterday) with a session.
 */
export function computeStats(
  history: HistoryEntry[],
  nowMs = Date.now(),
): HistoryStats {
  const now = new Date(nowMs)
  const weekAgo = nowMs - 7 * DAY_MS

  let thisWeek = 0
  let thisMonth = 0
  const dayset = new Set<number>()

  for (const h of history) {
    const t = new Date(h.dateISO).getTime()
    if (Number.isNaN(t)) continue
    if (t >= weekAgo) thisWeek += 1
    const d = new Date(t)
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      thisMonth += 1
    }
    dayset.add(startOfDay(d))
  }

  // Streak: start from today; if today has none but yesterday does, start there.
  let streak = 0
  const today = startOfDay(now)
  let cursor = today
  if (!dayset.has(today)) {
    if (dayset.has(today - DAY_MS)) {
      cursor = today - DAY_MS
    } else {
      return { thisWeek, thisMonth, streak: 0 }
    }
  }
  while (dayset.has(cursor)) {
    streak += 1
    cursor -= DAY_MS
  }

  return { thisWeek, thisMonth, streak }
}
