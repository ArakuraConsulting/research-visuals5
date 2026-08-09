import type { Point } from '../lib/progress'

export interface Bar {
  label: string
  value: number
  sub?: string
}

/**
 * Simple responsive bar chart built from divs (no dependencies).
 * The tallest bar sets the scale; zero-value bars show a faint stub.
 */
export function BarChart({
  bars,
  unit = '',
  height = 150,
}: {
  bars: Bar[]
  unit?: string
  height?: number
}) {
  const max = Math.max(1, ...bars.map((b) => b.value))
  // Reserve room for the value label (top) and axis label (bottom); the rest
  // is the plot area. Bars use explicit pixel heights so they never collapse.
  const area = Math.max(40, height - 32)
  return (
    <div className="flex items-end gap-1.5">
      {bars.map((b, i) => {
        const barPx = b.value > 0 ? Math.max(4, (b.value / max) * area) : 3
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="h-3 text-[10px] font-semibold leading-3 tabular-nums text-white/60">
              {b.value > 0 ? b.value : ''}
            </span>
            <div
              className={`w-full max-w-[22px] rounded-t-md ${
                b.value > 0 ? 'bg-accent-500' : 'bg-white/10'
              }`}
              style={{ height: barPx }}
              title={`${b.value}${unit}${b.sub ? ` · ${b.sub}` : ''}`}
            />
            <span className="text-[10px] font-medium text-white/40">{b.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Responsive line chart (SVG) for a numeric series over time — used for the
 * body-weight / body-composition trend.
 */
export function LineChart({
  points,
  unit = '',
  height = 160,
}: {
  points: Point[]
  unit?: string
  height?: number
}) {
  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl bg-white/5 text-sm text-white/40"
        style={{ height }}
      >
        No data yet
      </div>
    )
  }

  const W = 320
  const H = 120
  const padX = 10
  const padY = 14
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1

  const sx = (x: number) => padX + ((x - minX) / spanX) * (W - 2 * padX)
  const sy = (y: number) => H - padY - ((y - minY) / spanY) * (H - 2 * padY)

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ')
  const areaPath =
    `M ${sx(points[0].x).toFixed(1)} ${(H - padY).toFixed(1)} ` +
    points.map((p) => `L ${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ') +
    ` L ${sx(points[points.length - 1].x).toFixed(1)} ${(H - padY).toFixed(1)} Z`

  const first = points[0]
  const last = points[points.length - 1]
  const latest = last.y
  const delta = last.y - first.y

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold tabular-nums text-white">
          {latest}
          <span className="ml-1 text-sm font-semibold text-white/50">{unit}</span>
        </span>
        {points.length > 1 && (
          <span
            className={`text-sm font-semibold tabular-nums ${
              delta < 0 ? 'text-emerald-400' : delta > 0 ? 'text-rose-300' : 'text-white/50'
            }`}
          >
            {delta > 0 ? '+' : ''}
            {delta.toFixed(1)} {unit} since {first.label}
          </span>
        )}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label="Trend chart"
      >
        <defs>
          <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#lc-fill)" />
        <path d={path} fill="none" stroke="#4f8ff7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={i === points.length - 1 ? 3.5 : 2}
            fill={i === points.length - 1 ? '#e8eefc' : '#4f8ff7'}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] font-medium text-white/40">
        <span>{first.label}</span>
        <span>{last.label}</span>
      </div>
    </div>
  )
}
