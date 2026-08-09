import { useEffect } from 'react'

type WakeLockSentinelLike = {
  release: () => Promise<void>
  addEventListener?: (type: string, cb: () => void) => void
}

/**
 * Keep the screen awake while `active` is true, using the Screen Wake Lock API.
 * Falls back gracefully (does nothing) where unsupported, and re-acquires the
 * lock when the tab becomes visible again after being backgrounded.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
    }
    if (!nav.wakeLock) return // unsupported — graceful fallback

    let sentinel: WakeLockSentinelLike | null = null
    let cancelled = false

    const acquire = async () => {
      try {
        sentinel = await nav.wakeLock!.request('screen')
      } catch {
        // Denied (e.g. low battery) — ignore, screen may just sleep.
      }
    }

    const handleVisibility = () => {
      if (!cancelled && document.visibilityState === 'visible') {
        acquire()
      }
    }

    acquire()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      if (sentinel) sentinel.release().catch(() => {})
      sentinel = null
    }
  }, [active])
}
