import { useMemo, useState } from 'react'
import type { BodyEntry, HistoryEntry, Settings } from '../types'
import { BackButton, PrimaryButton } from './ui'
import { ConfirmDialog } from './ConfirmDialog'
import { BarChart, LineChart } from './charts'
import { dailyBuckets, weeklyBuckets, bodySeries } from '../lib/progress'
import { computeStats } from '../lib/stats'
import { formatDate } from '../lib/time'
import { makeId } from '../lib/util'

type MetricKey = 'weight' | 'bodyFatPct' | 'muscleMassKg' | 'bodyWaterPct' | 'boneMassKg' | 'bmi'

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
  const [showMore, setShowMore] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<BodyEntry | null>(null)

  // Measurement form fields
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [muscle, setMuscle] = useState('')
  const [water, setWater] = useState('')
  const [bone, setBone] = useState('')
  const [bmi, setBmi] = useState('')

  const stats = useMemo(() => computeStats(history), [history])
  const daily = useMemo(() => dailyBuckets(history, 14), [history])
  const weekly = useMemo(() => weeklyBuckets(history, 8), [history])
  const u = settings.units

  const metrics: { key: MetricKey; label: string; unit: string }[] = [
    { key: 'weight', label: 'Weight', unit: u },
    { key: 'bodyFatPct', label: 'Body fat', unit: '%' },
    { key: 'muscleMassKg', label: 'Muscle', unit: u },
    { key: 'bodyWaterPct', label: 'Water', unit: '%' },
    { key: 'boneMassKg', label: 'Bone', unit: u },
    { key: 'bmi', label: 'BMI', unit: '' },
  ]
  const activeMetric = metrics.find((m) => m.key === metric)!
  const series = useMemo(() => bodySeries(bodyEntries, metric), [bodyEntries, metric])

  const canSave =
    num(weight) !== undefined ||
    num(bodyFat) !== undefined ||
    num(muscle) !== undefined ||
    num(water) !== undefined ||
    num(bone) !== undefined ||
    num(bmi) !== undefined

  const save = () => {
    if (!canSave) return
    const entry: BodyEntry = {
      id: makeId('body'),
      dateISO: new Date().toISOString(),
      units: u,
      weight: num(weight),
      bodyFatPct: num(bodyFat),
      muscleMassKg: num(muscle),
      bodyWaterPct: num(water),
      boneMassKg: num(bone),
      bmi: num(bmi),
    }
    onAddBody(entry)
    setWeight('')
    setBodyFat('')
    setMuscle('')
    setWater('')
    setBone('')
    setBmi('')
    setShowMore(false)
  }

  const input =
    'w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-accent-400 focus:outline-none'

  return (
    <div className="mx-auto min-h-full max-w-md px-4 pb-16 pt-4 safe-top">
      <header className="mb-6 flex items-center gap-3">
        <BackButton onClick={onBack} />
        <h1 className="text-2xl font-extrabold text-white">Progress</h1>
      </header>

      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <StatTile value={stats.thisWeek} label="This week" />
          <StatTile value={stats.thisMonth} label="This month" />
          <StatTile
            value={stats.streak === 1 ? '1 day' : `${stats.streak} days`}
            label="Streak"
          />
        </div>

        {/* Daily */}
        <Section title="Daily" subtitle="Minutes trained · last 14 days">
          <BarChart
            bars={daily.map((d) => ({ label: d.label, value: d.minutes, sub: `${d.sessions} session(s)` }))}
            unit=" min"
          />
        </Section>

        {/* Weekly */}
        <Section title="Weekly" subtitle="Sessions · last 8 weeks">
          <BarChart
            bars={weekly.map((w) => ({ label: w.label, value: w.sessions, sub: `${w.minutes} min` }))}
          />
        </Section>

        {/* Body trend */}
        <Section title="Body measurements" subtitle="Log weight and scale metrics to correlate with training">
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
            <label
              htmlFor="bw-weight"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50"
            >
              Weight ({u})
            </label>
            <input
              id="bw-weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={`Today's weight in ${u}`}
              className={input}
            />

            <button
              onClick={() => setShowMore((v) => !v)}
              className="mt-3 text-sm font-semibold text-accent-300 active:text-accent-200"
            >
              {showMore ? '− Hide scale metrics' : '+ Add scale metrics (Renpho)'}
            </button>

            {showMore && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Body fat %" value={bodyFat} onChange={setBodyFat} />
                <Field label={`Muscle mass (${u})`} value={muscle} onChange={setMuscle} />
                <Field label="Body water %" value={water} onChange={setWater} />
                <Field label={`Bone mass (${u})`} value={bone} onChange={setBone} />
                <Field label="BMI" value={bmi} onChange={setBmi} />
              </div>
            )}

            <div className="mt-4">
              <PrimaryButton onClick={save} disabled={!canSave}>
                Save measurement
              </PrimaryButton>
            </div>
          </div>
        </Section>

        {/* Recent measurements */}
        {bodyEntries.length > 0 && (
          <Section title="Logged measurements">
            <div className="space-y-2">
              {bodyEntries.slice(0, 12).map((e) => (
                <div
                  key={e.id}
                  className="flex items-start justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{formatDate(e.dateISO)}</p>
                    <p className="mt-0.5 text-xs text-white/60">
                      {[
                        e.weight != null && `${e.weight} ${e.units}`,
                        e.bodyFatPct != null && `${e.bodyFatPct}% fat`,
                        e.muscleMassKg != null && `${e.muscleMassKg} ${e.units} muscle`,
                        e.bodyWaterPct != null && `${e.bodyWaterPct}% water`,
                        e.boneMassKg != null && `${e.boneMassKg} ${e.units} bone`,
                        e.bmi != null && `BMI ${e.bmi}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
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
