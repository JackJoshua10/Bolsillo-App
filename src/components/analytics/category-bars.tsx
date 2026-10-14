import Link from "next/link"

import { CategoryIcon } from "@/components/finance/category-icon"
import type { CategoryShare } from "@/lib/analytics"
import { formatMoney } from "@/lib/money"
import type { Category } from "@/types/finance"

const percent = new Intl.NumberFormat("es-PE", { style: "percent", maximumFractionDigits: 0 })

interface CategoryBarsProps {
  shares: CategoryShare[]
  categories: Category[]
  /** URL de Movimientos filtrada por la categoría */
  hrefFor: (categoryId: string | null) => string | null
}

/**
 * "En qué gastas": barras horizontales de un solo color (una serie), ordenadas de mayor a menor.
 * El largo se mide contra la categoría más grande; el % es sobre el total del periodo.
 * Cada fila muestra su monto, así que funciona también como tabla.
 */
export function CategoryBars({ shares, categories, hrefFor }: CategoryBarsProps) {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const max = shares[0]?.cents ?? 0

  return (
    <ul className="flex flex-col">
      {shares.map((s) => {
        const category = s.categoryId ? byId.get(s.categoryId) : undefined
        const name = category?.name ?? (s.categoryId ? "Categoría archivada" : "Sin categoría")
        const href = hrefFor(s.categoryId)
        const content = (
          <>
            <div className="flex items-center gap-3">
              <CategoryIcon
                icon={category?.icon ?? null}
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
              />
              <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
              <span className="num text-sm">{formatMoney(s.cents, "PEN")}</span>
              <span className="w-10 text-right num text-xs text-muted-foreground">{percent.format(s.share)}</span>
            </div>
            <div aria-hidden className="mt-2 ml-7 h-1.5">
              <div
                className="h-full rounded-r-[4px] bg-chart-accent transition-opacity group-hover:opacity-80"
                style={{ width: `${Math.max(2, (s.cents / max) * 100)}%` }}
              />
            </div>
          </>
        )

        return (
          <li key={s.categoryId ?? "none"} className="border-b border-line last:border-b-0">
            {href ? (
              <Link
                href={href}
                aria-label={`${name}: ${formatMoney(s.cents, "PEN")}, ${percent.format(s.share)} del total. Ver movimientos`}
                className="group block py-3 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {content}
              </Link>
            ) : (
              <div className="py-3">{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
