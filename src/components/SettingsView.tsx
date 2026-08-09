import { useRef, useState } from 'react'
import type { Settings, Units } from '../types'
import { BackButton } from './ui'
import { copyBackup, downloadBackup, restoreFromString } from '../lib/backup'

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

  const [copied, setCopied] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const doCopy = async () => {
    const ok = await copyBackup()
    setCopied(ok)
    if (ok) window.setTimeout(() => setCopied(false), 2500)
    else setRestoreMsg('Could not copy automatically — use “Download backup” instead.')
  }

  const applyRestore = (text: string) => {
    const res = restoreFromString(text)
    if (res.ok) {
      setRestoreMsg('Restored! Reloading…')
      window.setTimeout(() => window.location.reload(), 700)
    } else {
      setRestoreMsg(res.error ?? 'Restore failed.')
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      applyRestore(await file.text())
    } catch {
      setRestoreMsg('Could not read that file.')
    }
  }

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

        {/* Backup & restore */}
        <section className="rounded-3xl bg-white/5 p-5">
          <p className="text-sm font-bold uppercase tracking-wide text-white/60">
            Backup &amp; restore
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            Your data is saved on this device only. Back it up before adding the
            app to your Home Screen (the installed app can use separate storage),
            or to keep a safe copy. Restoring loads a backup into this device.
          </p>

          <div className="mt-4 space-y-2">
            <button
              onClick={doCopy}
              className="w-full rounded-2xl bg-accent-500 px-4 py-3 text-base font-semibold text-white active:scale-[0.98]"
            >
              {copied ? 'Copied to clipboard ✓' : 'Copy my data'}
            </button>
            <button
              onClick={downloadBackup}
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base font-semibold text-white active:scale-[0.98]"
            >
              Download backup file
            </button>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
              Restore
            </p>
            <div className="space-y-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base font-semibold text-white active:scale-[0.98]"
              >
                Restore from file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <button
                onClick={() => setPasteOpen((v) => !v)}
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-base font-semibold text-white active:scale-[0.98]"
              >
                Paste backup text
              </button>
              {pasteOpen && (
                <div className="space-y-2 pt-1">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste your copied backup here"
                    rows={4}
                    className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-accent-400 focus:outline-none"
                  />
                  <button
                    onClick={() => applyRestore(pasteText)}
                    disabled={pasteText.trim().length === 0}
                    className="w-full rounded-2xl bg-accent-500 px-4 py-3 text-base font-semibold text-white active:scale-[0.98] disabled:opacity-40"
                  >
                    Restore from pasted text
                  </button>
                </div>
              )}
            </div>
            {restoreMsg && (
              <p className="mt-3 text-sm font-medium text-accent-300">{restoreMsg}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
