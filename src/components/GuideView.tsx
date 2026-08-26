import type { ReactNode } from 'react'
import { BackButton } from './ui'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white shadow-card ring-1 ring-ink-line/60 p-5">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      <div className="mt-2 space-y-2 text-[15px] leading-relaxed text-ink-soft">
        {children}
      </div>
    </section>
  )
}

/** Static "Finding your weight" guide. */
export function GuideView({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto min-h-full max-w-md px-4 pb-16 pt-4 safe-top">
      <header className="mb-6 flex items-center gap-3">
        <BackButton onClick={onBack} />
        <h1 className="text-2xl font-extrabold text-ink font-display">
          Finding your weight
        </h1>
      </header>

      <div className="space-y-4">
        <Section title="Reading the notation">
          <p>
            “3 x 6-8” means three sets of six to eight repetitions. Not three
            reps. Rest between sets, then repeat.
          </p>
        </Section>

        <Section title="Choosing the weight">
          <p>
            Do a set of eight. Then ask how many more you could have done with
            clean form.
          </p>
          <ul className="mt-1 space-y-1">
            <li>Three or more left, go heavier next set.</li>
            <li>One or two left, that is the right weight.</li>
            <li>None left, go lighter.</li>
          </ul>
        </Section>

        <Section title="When to add weight">
          <p>
            When all three sets reach the top of the rep range with clean form,
            add weight the next session. Small jumps. There is no prize for
            rushing.
          </p>
        </Section>

        <Section title="Your first session">
          <p>
            Spend it finding these numbers and nothing else. That is a real
            session, not a wasted one.
          </p>
        </Section>
      </div>
    </div>
  )
}
