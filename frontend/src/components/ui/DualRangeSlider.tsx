'use client'

export function DualRangeSlider({
  min, max, step = 1,
  value, onChange, format,
}: {
  min: number; max: number; step?: number
  value: [number, number]
  onChange: (v: [number, number]) => void
  format: (v: number) => string
}) {
  const [lo, hi] = value
  const pctLo = ((lo - min) / (max - min)) * 100
  const pctHi = ((hi - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="relative h-5">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-slate-600 rounded" />
        <div className="absolute top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded"
          style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }} />
        <input type="range" min={min} max={max} step={step} value={lo}
          onChange={e => { const v = +e.target.value; if (v <= hi) onChange([v, hi]) }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ zIndex: lo > max - (max - min) * 0.1 ? 5 : 3 }} />
        <input type="range" min={min} max={max} step={step} value={hi}
          onChange={e => { const v = +e.target.value; if (v >= lo) onChange([lo, v]) }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ zIndex: 4 }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow pointer-events-none"
          style={{ left: `calc(${pctLo}% - 7px)` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow pointer-events-none"
          style={{ left: `calc(${pctHi}% - 7px)` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{format(lo)}</span><span>{format(hi)}</span>
      </div>
    </div>
  )
}
