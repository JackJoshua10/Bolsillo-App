import { cn } from "@/lib/utils"

interface SparklineProps {
  values: number[]
  className?: string
}

/** Línea de tendencia fina en citrino, sin ejes. */
export function Sparkline({ values, className }: SparklineProps) {
  if (values.length < 2) return null
  const w = 100
  const h = 32
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = values.map((v, i) => [(i / (values.length - 1)) * w, h - ((v - min) / range) * (h - 4) - 2])
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ")

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden className={cn("h-10 w-full", className)}>
      <path d={d} fill="none" stroke="var(--brand-text)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
