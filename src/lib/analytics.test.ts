import { describe, expect, it } from "vitest"

import {
  elapsedDays,
  expensesByCategory,
  lastPeriods,
  relativeChange,
  totalsByPeriod,
  usdExpenseCents,
  type AnalyticsTransaction,
} from "./analytics"
import { monthRange } from "./dates"

const tx = (
  occurredOn: string,
  amountCents: number,
  overrides: Partial<AnalyticsTransaction> = {},
): AnalyticsTransaction => ({
  type: "expense",
  amountCents,
  currency: "PEN",
  categoryId: "comida",
  occurredOn,
  ...overrides,
})

describe("lastPeriods", () => {
  it("devuelve los periodos del más antiguo al actual", () => {
    const periods = lastPeriods("2026-10-14", 3)
    expect(periods.map((p) => p.start)).toEqual(["2026-08-01", "2026-09-01", "2026-10-01"])
  })

  it("respeta el día de inicio de mes", () => {
    const periods = lastPeriods("2026-10-14", 2, 15)
    expect(periods.map((p) => [p.start, p.end])).toEqual([
      ["2026-08-15", "2026-09-15"],
      ["2026-09-15", "2026-10-15"],
    ])
  })

  it("cruza años", () => {
    expect(lastPeriods("2026-01-10", 2)[0].start).toBe("2025-12-01")
  })
})

describe("totalsByPeriod", () => {
  const periods = lastPeriods("2026-10-14", 2)

  it("suma gastos e ingresos por periodo, solo en soles", () => {
    const totals = totalsByPeriod(
      [
        tx("2026-09-30", 1000),
        tx("2026-10-01", 500),
        tx("2026-10-02", 200000, { type: "income" }),
        tx("2026-10-03", 9999, { currency: "USD" }),
        tx("2026-07-31", 777),
      ],
      periods,
    )
    expect(totals.map((t) => [t.expenseCents, t.incomeCents])).toEqual([
      [1000, 0],
      [500, 200000],
    ])
  })
})

describe("expensesByCategory", () => {
  const october = monthRange("2026-10-14")

  it("agrupa, ordena de mayor a menor y calcula la participación", () => {
    const shares = expensesByCategory(
      [
        tx("2026-10-01", 3000, { categoryId: "comida" }),
        tx("2026-10-02", 1000, { categoryId: "transporte" }),
        tx("2026-10-03", 4000, { categoryId: "comida" }),
        tx("2026-10-04", 5000, { type: "income", categoryId: "sueldo" }),
        tx("2026-09-30", 9000, { categoryId: "transporte" }),
      ],
      october,
    )
    expect(shares).toEqual([
      { categoryId: "comida", cents: 7000, share: 0.875 },
      { categoryId: "transporte", cents: 1000, share: 0.125 },
    ])
  })

  it("sin gastos devuelve lista vacía", () => {
    expect(expensesByCategory([], october)).toEqual([])
  })
})

describe("usdExpenseCents", () => {
  it("suma solo gastos en dólares del periodo", () => {
    const october = monthRange("2026-10-14")
    expect(
      usdExpenseCents(
        [
          tx("2026-10-01", 1500, { currency: "USD" }),
          tx("2026-10-01", 900),
          tx("2026-09-01", 100, { currency: "USD" }),
        ],
        october,
      ),
    ).toBe(1500)
  })
})

describe("elapsedDays", () => {
  it("cuenta hasta hoy en el periodo actual y completo en periodos pasados", () => {
    expect(elapsedDays(monthRange("2026-10-14"), "2026-10-14")).toBe(14)
    expect(elapsedDays(monthRange("2026-09-10"), "2026-10-14")).toBe(30)
  })
})

describe("relativeChange", () => {
  it("calcula la variación o null sin base", () => {
    expect(relativeChange(120, 100)).toBeCloseTo(0.2)
    expect(relativeChange(50, 100)).toBeCloseTo(-0.5)
    expect(relativeChange(50, 0)).toBeNull()
  })
})
