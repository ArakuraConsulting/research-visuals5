import { useMemo, useState } from 'react'
import type { BodyEntry, HistoryEntry, Settings } from '../types'
import { BackButton, PrimaryButton } from './ui'
import { ConfirmDialog } from './ConfirmDialog'
import { BarChart, LineChart } from './charts'
import { dailyBuckets, weeklyBuckets, bodySeries } from '../lib/progress'
import { computeStats } from '../lib/stats'
import { formatDate } from '../lib/time'
import { makeId } from '../lib/util'

type MetricKey =
  | 'weight'
  | 'bmi'
  | 'bodyFatPct'
  | 'skeletalMusclePct'
  | 'fatFreeMassKg'
  | 'subcutaneousFatPct'
  | 'visceralFat'
  | 'bodyWaterPct'
  | 'muscleMassKg'
  | 'boneMassKg'
  | 'proteinPct'
  | 'bmrKcal'
  | 'metabolicAge'

/** Today's date as yyyy-mm-dd for the date input default. */
function todayInput(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl bg-white/5 p-4">
      <div className="mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-white/60">{title}</h2>
        {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3 text-center">
      <p className="text-xl font-extrabold text-accent-400">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">
        {label}
      </p>
    </div>
  )
}

const num = (s: string): number | undefined => {
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : undefined
}

export function ProgressView({
  history,
  bodyEntries,
  settings,
  onBack,
  onAddBody,
  onDeleteBody,
}: {
  history: HistoryEntry[]
  bodyEntries: BodyEntry[]
  settings: Settings
  onBack: () => void
  onAddBody: (entry: BodyEntry) => void
  onDeleteBody: (id: string) => void
}) {
  const [metric, setMetric] = useState<MetricKey>('weight')
  const [pendingDelete, setPendingDelete] = useState<BodyEntry | null>(null)

  // Measurement form fields
  const [date, setDate] = useState(todayInput())
  const [fields, setFields] = useState<Record<MetricKey, string>>({
    weight: '',
    bmi: '',
    bodyFatPct: '',
    skeletalMusclePct: '',
    fatFreeMassKg: '',
    subcutaneousFatPct: '',
    visceralFat: '',
    bodyWaterPct: '',
    muscleMassKg: '',
    boneMassKg: '',
    proteinPct: '',
    bmrKcal: '',
    metabolicAge: '',
  })
  const setField = (k: MetricKey, v: string) =>
    setFields((prev) => ({ ...prev, [k]: v }))

  const stats = useMemo(() => computeStats(history), [history])
  const daily = useMemo(() => dailyBuckets(history, 14), [history])
  const weekly = useMemo(() => weeklyBuckets(history, 8), [history])
  const u = settings.units

  // Ordered to match the Renpho "Health Status" panel top-to-bottom.
  const metrics: { key: MetricKey; label: string; unit: string; field: string }[] = [
    { key: 'weight', label: 'Weight', unit: u, field: `Weight (${u})` },
    { key: 'bmi', label: 'BMI', unit: '', field: 'BMI' },
    { key: 'bodyFatPct', label: 'Body fat', unit: '%', field: 'Body fat %' },
    { key: 'skeletalMusclePct', label: 'Skeletal', unit: '%', field: 'Skeletal muscle %' },
    { key: 'fatFreeMassKg', label: 'Fat-free', unit: u, field: `Fat-free mass (${u})` },
    { key: 'subcutaneousFatPct', label: 'Subcut.', unit: '%', field: 'Subcutaneous fat %' },
    { key: 'visceralFat', label: 'Visceral', unit: '', field: 'Visceral fat' },
    { key: 'bodyWaterPct', label: 'Water', unit: '%', field: 'Body water %' },
    { key: 'muscleMassKg', label: 'Muscle', unit: u, field: `Muscle mass (${u})` },
    { key: 'boneMassKg', label: 'Bone', unit: u, field: `Bone mass (${u})` },
    { key: 'proteinPct', label: 'Protein', unit: '%', field: 'Protein %' },
    { key: 'bmrKcal', label: 'BMR', unit: 'kcal', field: 'BMR (kcal)' },
    { key: 'metabolicAge', label: 'Metab. age', unit: 'yr', field: 'Metabolic age (yr)' },
  ]
  const activeMetric = metrics.find((m) => m.key === metric)!
  const series = useMemo(() => bodySeries(bodyEntries, metric), [bodyEntries, metric])

  const canSave = metrics.some((m) => num(fields[m.key]) !== undefined)

  const save = () => {
    if (!canSave) return
    const entry: BodyEntry = {
      id: makeId('body'),
      dateISO: new Date(`${date}T12:00:00`).toISOString(),
      units: u,
    }
    for (const m of metrics) {
      const v = num(fields[m.key])
      if (v !== undefined) (entry as unknown as Record<string, unknown>)[m.key] = v
    }
    onAddBody(entry)
    setFields((prev) => {
      const cleared = { ...prev }
      ;(Object.keys(cleared) as MetricKey[]).forEach((k) => (cleared[k] = ''))
      return cleared
    })
    setDate(todayInput())
  }

  const summarise = (e: BodyEntry): string =>
    metrics
      .map((m) => {
        const v = (e as unknown as Record<string, unknown>)[m.key]
        if (typeof v !== 'number') return null
        const suffix = m.unit === '%' ? '%' : m.unit ? ` ${m.unit}` : ''
        return `${m.label} ${v}${suffix}`
      })
      .filter(Boolean)
      .join(' · ')

  return (
    <div className="mx-auto min-h-full max-w-md px-4 pb-16 pt-4 safe-top">
      <header className="mb-6 flex items-center gap-3">
        <BackButton onClick={onBack} />
        <h1 className="text-2xl font-extrabold text-white">Progress</h1>
      </header>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <StatTile value={stats.thisWeek} label="This week" />
          <StatTile value={stats.thisMonth} label="This month" />
          <StatTile
            value={stats.streak === 1 ? '1 day' : `${stats.streak} days`}
            label="Streak"
          />
        </div>

        <Section title="Daily" subtitle="Minutes trained · last 14 days">
          <BarChart
            bars={daily.map((d) => ({ label: d.label, value: d.minutes, sub: `${d.sessions} session(s)` }))}
            unit=" min"
          />
        </Section>

        <Section title="Weekly" subtitle="Sessions · last 8 weeks">
          <BarChart
            bars={weekly.map((w) => ({ label: w.label, value: w.sessions, sub: `${w.minutes} min` }))}
          />
        </Section>

        <Section title="Body measurements" subtitle="Log your scale reading to correlate with training">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {metrics.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  metric === m.key
                    ? 'bg-accent-500 text-white'
                    : 'bg-white/5 text-white/60 active:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <LineChart points={series} unit={activeMetric.unit} />

          {/* Logger */}
          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="mb-4">
              <label
                htmlFor="bw-date"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/50"
              >
                Date
              </label>
              <input
                id="bw-date"
                type="date"
                value={date}
                max={todayInput()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-base text-white focus:border-accent-400 focus:outline-none [color-scheme:dark]"
              />
            </div>

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
              Enter any fields your scale shows
            </p>
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((m) => (
                <Field
                  key={m.key}
                  label={m.field}
                  value={fields[m.key]}
                  onChange={(v) => setField(m.key, v)}
                />
              ))}
            </div>

            <div className="mt-4">
              <PrimaryButton onClick={save} disabled={!canSave}>
                Save measurement
              </PrimaryButton>
            </div>
          </div>
        </Section>

        {bodyEntries.length > 0 && (
          <Section title="Logged measurements">
            <div className="space-y-2">
              {bodyEntries.slice(0, 15).map((e) => (
                <div
                  key={e.id}
                  className="flex items-start justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{formatDate(e.dateISO)}</p>
                    <p className="mt-0.5 text-xs text-white/60">{summarise(e)}</p>
                  </div>
                  <button
                    onClick={() => setPendingDelete(e)}
                    aria-label="Delete measurement"
                    className="shrink-0 rounded-xl bg-white/5 px-2 py-1.5 text-xs font-semibold text-white/40 active:text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this measurement?"
        message="This body measurement will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDelete) onDeleteBody(pendingDelete.id)
          setPendingDelete(null)
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-white/50">
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step="0.1"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-base text-white focus:border-accent-400 focus:outline-none"
      />
    </label>
  )
}
