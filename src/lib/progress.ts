import type { BodyEntry, HistoryEntry } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Monday-based start of the week containing d. */
function startOfWeek(d: Date): Date {
  const s = startOfDay(d)
  const day = (s.getDay() + 6) % 7 // 0 = Monday
  return new Date(s.getTime() - day * DAY_MS)
}

export interface DayBucket {
  dateISO: string
  label: string // e.g. "M", "T" (weekday initial)
  dayNum: number // day of month
  sessions: number
  minutes: number
}

export interface WeekBucket {
  weekStartISO: string
  label: string // e.g. "4 Aug"
  sessions: number
  minutes: number
}

/** Last `days` days (oldest → newest), with sessions and minutes trained. */
export function dailyBuckets(
  history: HistoryEntry[],
  days = 14,
  nowMs = Date.now(),
): DayBucket[] {
  const today = startOfDay(new Date(nowMs)).getTime()
  const buckets: DayBucket[] = []
  const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today - i * DAY_MS)
    buckets.push({
      dateISO: d.toISOString(),
      label: WEEKDAY[d.getDay()],
      dayNum: d.getDate(),
      sessions: 0,
      minutes: 0,
    })
  }
  const index = new Map(buckets.map((b, i) => [startOfDay(new Date(b.dateISO)).getTime(), i]))
  for (const h of history) {
    const t = startOfDay(new Date(h.dateISO)).getTime()
    const i = index.get(t)
    if (i === undefined) continue
    buckets[i].sessions += 1
    buckets[i].minutes += Math.round(h.elapsedSeconds / 60)
  }
  return buckets
}

/** Last `weeks` weeks (oldest → newest), Monday-based. */
export function weeklyBuckets(
  history: HistoryEntry[],
  weeks = 8,
  nowMs = Date.now(),
): WeekBucket[] {
  const thisWeek = startOfWeek(new Date(nowMs)).getTime()
  const buckets: WeekBucket[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(thisWeek - i * 7 * DAY_MS)
    buckets.push({
      weekStartISO: d.toISOString(),
      label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      sessions: 0,
      minutes: 0,
    })
  }
  const index = new Map(
    buckets.map((b, i) => [startOfWeek(new Date(b.weekStartISO)).getTime(), i]),
  )
  for (const h of history) {
    const t = startOfWeek(new Date(h.dateISO)).getTime()
    const i = index.get(t)
    if (i === undefined) continue
    buckets[i].sessions += 1
    buckets[i].minutes += Math.round(h.elapsedSeconds / 60)
  }
  return buckets
}

export interface Point {
  x: number // epoch ms
  y: number
  label: string
}

/** Time-ordered points for one numeric field of the body measurements. */
export function bodySeries(
  entries: BodyEntry[],
  field: keyof BodyEntry,
): Point[] {
  return entries
    .filter((e) => typeof e[field] === 'number')
    .map((e) => ({
      x: new Date(e.dateISO).getTime(),
      y: e[field] as number,
      label: new Date(e.dateISO).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      }),
    }))
    .sort((a, b) => a.x - b.x)
}
