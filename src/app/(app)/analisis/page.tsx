import { ChartColumn } from "lucide-react"
import type { Metadata } from "next"

import { CategoryBars } from "@/components/analytics/category-bars"
import { MonthlyColumns, type MonthColumn } from "@/components/analytics/monthly-columns"
import { StatTile } from "@/components/analytics/stat-tile"
import { AmountDisplay } from "@/components/finance/amount-display"
import { PeriodNav, periodLabel } from "@/components/period-nav"
import {
  elapsedDays,
  expensesByCategory,
  lastPeriods,
  relativeChange,
  totalsByPeriod,
  usdExpenseCents,
} from "@/lib/analytics"
import { addDays, monthRange, shortMonthLabel, todayISO } from "@/lib/dates"
import { formatMoney } from "@/lib/money"
import { filtersHref, parseFilterParams } from "@/lib/transaction-filters"
import { getProfile } from "@/server/auth"
import { getActiveSpaceId, listAnalyticsTransactions, listCategories } from "@/server/finance"

export const metadata: Metadata = { title: "Análisis" }

const MONTHS_IN_CHART = 6

export default async function AnalyticsPage(props: PageProps<"/analisis">) {
  const profile = await getProfile()
  const spaceId = await getActiveSpaceId()
  const today = todayISO()
  const { periodo } = parseFilterParams(await props.searchParams, today)
  const startDay = profile.month_start_day

  const range = monthRange(periodo ?? today, startDay)
  const previousRange = monthRange(addDays(range.start, -1), startDay)
  const currentStart = monthRange(today, startDay).start
  // El gráfico muestra los últimos meses hasta hoy; solo se corre si el periodo elegido queda fuera
  const recent = lastPeriods(today, MONTHS_IN_CHART, startDay)
  const chartPeriods = recent.some((p) => p.start === range.start)
    ? recent
    : lastPeriods(range.start, MONTHS_IN_CHART, startDay)
  // En la URL, el periodo actual no lleva ?periodo
  const periodParam = (start: string) => (start === currentStart ? undefined : start)
  const hrefForPeriod = (start: string) => {
    const param = periodParam(start)
    return param ? `/analisis?periodo=${param}` : "/analisis"
  }

  const [transactions, categories] = await Promise.all([
    listAnalyticsTransactions(
      spaceId,
      chartPeriods[0].start < previousRange.start ? chartPeriods[0].start : previousRange.start,
      chartPeriods[chartPeriods.length - 1].end > range.end ? chartPeriods[chartPeriods.length - 1].end : range.end,
    ),
    listCategories(spaceId),
  ])

  const totals = totalsByPeriod(transactions, chartPeriods)
  const [previous, current] = totalsByPeriod(transactions, [previousRange, range])
  const shares = expensesByCategory(transactions, range)
  const usdSpent = usdExpenseCents(transactions, range)
  const balance = current.incomeCents - current.expenseCents
  const dailyAverage = Math.round(current.expenseCents / elapsedDays(range, today))

  const columns: MonthColumn[] = totals.map((t) => ({
    key: t.range.start,
    shortLabel: shortMonthLabel(t.range.start),
    fullLabel: periodLabel(t.range, today),
    expenseCents: t.expenseCents,
    incomeCents: t.incomeCents,
    selected: t.range.start === range.start,
    href: hrefForPeriod(t.range.start),
  }))
  const hasHistory = totals.some((t) => t.expenseCents || t.incomeCents)

  return (
    <>
      <header className="px-5 pt-5">
        <h1 className="text-lg font-semibold">Análisis</h1>
      </header>

      <div className="mt-4">
        <PeriodNav
          label={periodLabel(range, today)}
          prevHref={hrefForPeriod(previousRange.start)}
          nextHref={range.end <= today ? hrefForPeriod(monthRange(range.end, startDay).start) : null}
        />
      </div>

      {/* Cifras clave del periodo */}
      <section aria-label="Resumen del periodo" className="mx-5 mt-2 grid grid-cols-2 border-y border-line">
        <StatTile
          label="Gastado"
          change={relativeChange(current.expenseCents, previous.expenseCents)}
          upIsGood={false}
          changeLabel="vs. anterior"
          className="border-r border-b border-line pr-4"
        >
          <AmountDisplay cents={current.expenseCents} currency="PEN" size="lg" />
        </StatTile>
        <StatTile
          label="Ingresos"
          change={relativeChange(current.incomeCents, previous.incomeCents)}
          changeLabel="vs. anterior"
          className="border-b border-line pl-4"
        >
          <AmountDisplay cents={current.incomeCents} currency="PEN" size="lg" />
        </StatTile>
        <StatTile label="Balance" className="border-r border-line pr-4">
          <AmountDisplay cents={balance} currency="PEN" size="lg" />
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {balance >= 0 ? "Ingresos menos gastos" : "Gastaste más de lo que ingresó"}
          </p>
        </StatTile>
        <StatTile label="Promedio diario" className="pl-4">
          <AmountDisplay cents={dailyAverage} currency="PEN" size="lg" />
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            en {elapsedDays(range, today)} {elapsedDays(range, today) === 1 ? "día" : "días"}
          </p>
        </StatTile>
      </section>
      {usdSpent > 0 && (
        <p className="mx-5 mt-2 text-xs text-muted-foreground">
          Además gastaste <span className="num">{formatMoney(usdSpent, "USD")}</span> en dólares (no se incluye arriba).
        </p>
      )}

      {/* En qué gastas */}
      <section className="mt-8 px-5">
        <h2 className="text-xs tracking-wide text-muted-foreground uppercase">En qué gastas</h2>
        {shares.length === 0 ? (
          <p className="mt-4 border border-dashed border-line px-4 py-5 text-sm text-muted-foreground">
            No hay gastos en este periodo.
          </p>
        ) : (
          <div className="mt-2">
            <CategoryBars
              shares={shares}
              categories={categories}
              hrefFor={(categoryId) =>
                categoryId
                  ? filtersHref({ periodo: periodParam(range.start), tipo: "gasto", categoria: categoryId })
                  : null
              }
            />
          </div>
        )}
      </section>

      {/* Tendencia */}
      <section className="mt-8 px-5 pb-4">
        <h2 className="text-xs tracking-wide text-muted-foreground uppercase">
          Gasto de los últimos {MONTHS_IN_CHART} meses
        </h2>
        {hasHistory ? (
          <div className="mt-4">
            <MonthlyColumns columns={columns} />
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-3 border border-dashed border-line px-4 py-5 text-sm text-muted-foreground">
            <ChartColumn className="size-5 shrink-0" strokeWidth={1.5} />
            Cuando registres gastos, aquí verás cómo cambian mes a mes.
          </div>
        )}
      </section>
    </>
  )
}
