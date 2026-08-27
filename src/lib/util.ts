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
  Strength: 'bg-blue-500/12 text-blue-700 ring-1 ring-inset ring-blue-500/20',
  Cardio: 'bg-rose-500/12 text-rose-600 ring-1 ring-inset ring-rose-500/20',
  Flexibility:
    'bg-teal-500/12 text-teal-700 ring-1 ring-inset ring-teal-500/20',
  Mindfulness:
    'bg-violet-500/12 text-violet-700 ring-1 ring-inset ring-violet-500/20',
}
