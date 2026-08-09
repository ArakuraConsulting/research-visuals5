import type { ReactNode } from 'react'
import type { Category } from '../types'
import { categoryPill } from '../lib/util'

export function CategoryPill({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryPill[category]}`}
    >
      {category}
    </span>
  )
}

export function Card({
  children,
  className = '',
  onClick,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  as?: 'div' | 'button'
}) {
  const base =
    'w-full rounded-3xl bg-white text-navy-950 shadow-card text-left'
  if (as === 'button') {
    return (
      <button
        onClick={onClick}
        className={`${base} active:scale-[0.99] transition-transform ${className}`}
      >
        {children}
      </button>
    )
  }
  return <div className={`${base} ${className}`}>{children}</div>
}

/** Large, thumb-friendly primary action button. */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = '',
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl bg-accent-500 px-6 py-4 text-lg font-semibold text-white shadow-soft transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-navy-600 disabled:text-white/50 ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-base font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

/** Simple back chevron control used in view headers. */
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Back"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white active:scale-95"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}
