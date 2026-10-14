/**
 * Cálculos de /analisis. Funciones puras (sin base de datos) para poder probarlas.
 * Solo cuentan gastos e ingresos: transferencias y ajustes no son gasto ni ingreso.
 */

import { addDays, monthRange, type MonthRange } from "./dates"
import type { Currency } from "./money"

export interface AnalyticsTransaction {
  type: "expense" | "income"
  amountCents: number
  currency: Currency
  categoryId: string | null
  occurredOn: string
}

export interface PeriodTotals {
  range: MonthRange
  expenseCents: number
  incomeCents: number
}

export interface CategoryShare {
  categoryId: string | null
  cents: number
  /** 0–1 respecto del total gastado en el periodo */
  share: number
}

/** Los `count` periodos que terminan en el que contiene `day`, del más antiguo al más reciente. */
export function lastPeriods(day: string, count: number, startDay = 1): MonthRange[] {
  const periods = [monthRange(day, startDay)]
  while (periods.length < count) periods.unshift(monthRange(addDays(periods[0].start, -1), startDay))
  return periods
}

/** Totales en soles por periodo. Los montos en dólares se informan aparte (no se convierten). */
export function totalsByPeriod(transactions: AnalyticsTransaction[], periods: MonthRange[]): PeriodTotals[] {
  const totals = periods.map((range) => ({ range, expenseCents: 0, incomeCents: 0 }))
  for (const t of transactions) {
    if (t.currency !== "PEN") continue
    const period = totals.find(({ range }) => t.occurredOn >= range.start && t.occurredOn < range.end)
    if (!period) continue
    if (t.type === "expense") period.expenseCents += t.amountCents
    else period.incomeCents += t.amountCents
  }
  return totals
}

/** Gasto en soles por categoría dentro de `range`, de mayor a menor. */
export function expensesByCategory(transactions: AnalyticsTransaction[], range: MonthRange): CategoryShare[] {
  const byCategory = new Map<string | null, number>()
  let total = 0
  for (const t of transactions) {
    if (t.type !== "expense" || t.currency !== "PEN") continue
    if (t.occurredOn < range.start || t.occurredOn >= range.end) continue
    byCategory.set(t.categoryId, (byCategory.get(t.categoryId) ?? 0) + t.amountCents)
    total += t.amountCents
  }
  return [...byCategory.entries()]
    .map(([categoryId, cents]) => ({ categoryId, cents, share: total ? cents / total : 0 }))
    .sort((a, b) => b.cents - a.cents)
}

/** Gasto en dólares dentro de `range` (se muestra aparte, sin convertir). */
export function usdExpenseCents(transactions: AnalyticsTransaction[], range: MonthRange) {
  return transactions
    .filter(
      (t) => t.type === "expense" && t.currency === "USD" && t.occurredOn >= range.start && t.occurredOn < range.end,
    )
    .reduce((sum, t) => sum + t.amountCents, 0)
}

/** Días del periodo que ya pasaron (hoy incluido); el periodo completo si ya terminó. */
export function elapsedDays(range: MonthRange, today: string) {
  const end = today < range.end ? addDays(today, 1) : range.end
  const days = (Date.parse(end) - Date.parse(range.start)) / 86_400_000
  return Math.max(1, Math.round(days))
}

/** Variación relativa (0.12 = +12 %). null si no hay base para comparar. */
export function relativeChange(current: number, previous: number) {
  if (previous === 0) return null
  return (current - previous) / previous
}
