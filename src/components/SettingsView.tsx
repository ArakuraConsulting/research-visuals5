import type { Settings, Units } from '../types'
import { BackButton } from './ui'

export function SettingsView({
  settings,
  onBack,
  onUpdate,
}: {
  settings: Settings
  onBack: () => void
  onUpdate: (partial: Partial<Settings>) => void
}) {
  const setUnits = (units: Units) => onUpdate({ units })

  return (
    <div className="mx-auto min-h-full max-w-md px-4 pb-16 pt-4 safe-top">
      <header className="mb-6 flex items-center gap-3">
        <BackButton onClick={onBack} />
        <h1 className="text-2xl font-extrabold text-white">Settings</h1>
      </header>

      <div className="space-y-6">
        {/* Bar weight */}
        <section className="rounded-3xl bg-white/5 p-5">
          <label
            htmlFor="bar-weight"
            className="block text-sm font-bold uppercase tracking-wide text-white/60"
          >
            Bar weight ({settings.units})
          </label>
          <input
            id="bar-weight"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={Number.isFinite(settings.barWeightKg) ? settings.barWeightKg : ''}
            onChange={(e) => {
              const n = Number.parseFloat(e.target.value)
              onUpdate({ barWeightKg: Number.isFinite(n) ? n : 0 })
            }}
            className="mt-2 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3.5 text-lg font-semibold text-white focus:border-accent-400 focus:outline-none"
          />
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Bar weight is added automatically to every barbell lift, so you only
            enter the plates. The running total is shown while you log each set.
          </p>
        </section>

        {/* Units */}
        <section className="rounded-3xl bg-white/5 p-5">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-white/60">
            Units
          </p>
          <div className="flex gap-2 rounded-2xl bg-white/5 p-1">
            {(['kg', 'lb'] as Units[]).map((u) => (
              <button
                key={u}
                onClick={() => setUnits(u)}
                className={`flex-1 rounded-xl py-3 text-base font-semibold transition ${
                  settings.units === u
                    ? 'bg-accent-500 text-white shadow-soft'
                    : 'text-white/60 active:text-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
