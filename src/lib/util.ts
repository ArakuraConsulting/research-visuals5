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
  Strength: 'bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/30',
  Cardio: 'bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/30',
  Flexibility:
    'bg-teal-500/15 text-teal-300 ring-1 ring-inset ring-teal-400/30',
  Mindfulness:
    'bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/30',
}
