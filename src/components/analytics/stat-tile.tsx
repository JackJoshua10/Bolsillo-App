import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface StatTileProps {
  label: string
  children: React.ReactNode
  /** Variación vs. el periodo anterior (0.12 = +12 %) */
  change?: number | null
  /** true si subir es bueno (ingresos); false si subir es malo (gastos) */
  upIsGood?: boolean
  changeLabel?: string
  className?: string
}

const percent = new Intl.NumberFormat("es-PE", { style: "percent", maximumFractionDigits: 0, signDisplay: "always" })

/**
 * Cifra clave con variación opcional. El texto va en colores de texto;
 * solo la flecha indica si el cambio es bueno o malo (nunca el color solo).
 */
export function StatTile({ label, children, change, upIsGood = true, changeLabel, className }: StatTileProps) {
  const showChange = change !== undefined && change !== null && Number.isFinite(change)
  const up = showChange && change > 0
  const good = showChange && (change === 0 || up === upIsGood)
  const Arrow = up ? ArrowUpRight : ArrowDownRight

  return (
    <div className={cn("flex min-w-0 flex-col gap-1 py-4", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="truncate">{children}</div>
      {showChange && (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Arrow aria-hidden className={cn("size-3.5", good ? "text-brand-text" : "text-warning")} />
          <span className="num">{percent.format(change)}</span>
          {changeLabel && <span>{changeLabel}</span>}
        </p>
      )}
    </div>
  )
}
