import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface PeriodNavProps {
  label: string
  prevHref: string
  /** null cuando el periodo es el actual (no hay futuro que mostrar) */
  nextHref: string | null
}

/** Flechas ‹ periodo › compartidas por Movimientos y Análisis. */
export function PeriodNav({ label, prevHref, nextHref }: PeriodNavProps) {
  return (
    <nav aria-label="Periodo" className="flex items-center justify-between px-3">
      <Link
        href={prevHref}
        scroll={false}
        aria-label="Periodo anterior"
        className="flex size-10 items-center justify-center text-muted-foreground"
      >
        <ChevronLeft className="size-5" />
      </Link>
      <p className="text-sm font-medium first-letter:uppercase">{label}</p>
      {nextHref ? (
        <Link
          href={nextHref}
          scroll={false}
          aria-label="Periodo siguiente"
          className="flex size-10 items-center justify-center text-muted-foreground"
        >
          <ChevronRight className="size-5" />
        </Link>
      ) : (
        <span aria-hidden className="flex size-10 items-center justify-center text-muted-foreground/30">
          <ChevronRight className="size-5" />
        </span>
      )}
    </nav>
  )
}

/** Etiqueta del periodo, con año solo si no es el año en curso. */
export function periodLabel(range: { start: string; label: string }, today: string) {
  const year = range.start.slice(0, 4)
  return year === today.slice(0, 4) ? range.label : `${range.label} ${year}`
}
