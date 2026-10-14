import Link from "next/link"

import { formatCompactMoney, formatMoney } from "@/lib/money"
import { cn } from "@/lib/utils"

export interface MonthColumn {
  key: string
  /** "set" */
  shortLabel: string
  /** "setiembre" o "15 set. – 14 oct." */
  fullLabel: string
  expenseCents: number
  incomeCents: number
  selected: boolean
  href: string
}

const PLOT_HEIGHT = 112 // px, sin contar la franja de etiquetas

/**
 * Gasto de los últimos meses en columnas: forma "énfasis" (el periodo elegido en el
 * color de acento, el resto en gris de contexto). Una sola escala, sin eje secundario.
 * Solo se rotula la columna elegida; las demás muestran su monto al pasar o enfocar,
 * y todas están en la tabla de abajo.
 */
export function MonthlyColumns({ columns }: { columns: MonthColumn[] }) {
  const max = Math.max(...columns.map((c) => c.expenseCents), 1)

  return (
    <figure>
      <div className="flex items-end gap-2 border-b border-line" style={{ height: PLOT_HEIGHT + 20 }}>
        {columns.map((c) => {
          const height = c.expenseCents ? Math.max(3, (c.expenseCents / max) * PLOT_HEIGHT) : 0
          return (
            <Link
              key={c.key}
              href={c.href}
              scroll={false}
              aria-current={c.selected ? "page" : undefined}
              aria-label={`${c.fullLabel}: ${formatMoney(c.expenseCents, "PEN")} gastados`}
              className="group relative flex h-full flex-1 flex-col items-center justify-end focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span
                className={cn(
                  "mb-1 num text-[10px] whitespace-nowrap text-muted-foreground",
                  c.selected ? "text-foreground" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                )}
              >
                {formatCompactMoney(c.expenseCents, "PEN")}
              </span>
              <span
                aria-hidden
                className={cn(
                  "w-full max-w-6 rounded-t-[4px] transition-opacity group-hover:opacity-80",
                  c.selected ? "bg-chart-accent" : "bg-chart-muted",
                )}
                style={{ height }}
              />
            </Link>
          )
        })}
      </div>
      <div aria-hidden className="mt-1.5 flex gap-2">
        {columns.map((c) => (
          <span
            key={c.key}
            className={cn(
              "flex-1 text-center text-[11px] text-muted-foreground",
              c.selected && "font-medium text-foreground",
            )}
          >
            {c.shortLabel}
          </span>
        ))}
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs text-muted-foreground">Ver como tabla</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1.5 font-normal">Periodo</th>
              <th className="py-1.5 text-right font-normal">Gastos</th>
              <th className="py-1.5 text-right font-normal">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((c) => (
              <tr key={c.key} className="border-t border-line">
                <td className="py-1.5 first-letter:uppercase">{c.fullLabel}</td>
                <td className="py-1.5 text-right num">{formatMoney(c.expenseCents, "PEN")}</td>
                <td className="py-1.5 text-right num">{formatMoney(c.incomeCents, "PEN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
