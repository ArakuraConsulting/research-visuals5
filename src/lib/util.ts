import type { Category } from '../types'

let counter = 0

/** Reasonably unique id without pulling in a dependency. */
export function makeId(prefix = 'id'): string {
  counter += 1
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}-${counter}-${rand}`
}

/** Tailwind classes for the small coloured category pill — one hue per category. */
export const categoryPill: Record<Category, string> = {
  Strength: 'bg-cream-200 text-ink-soft ring-1 ring-inset ring-ink-line',
  Cardio: 'bg-cream-200 text-ink-soft ring-1 ring-inset ring-ink-line',
  Flexibility: 'bg-cream-200 text-ink-soft ring-1 ring-inset ring-ink-line',
  Mindfulness: 'bg-cream-200 text-ink-soft ring-1 ring-inset ring-ink-line',
}
