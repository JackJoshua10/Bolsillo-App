import { describe, expect, it } from "vitest"

import { filtersHref, hasActiveFilters, parseFilterParams } from "./transaction-filters"

const TODAY = "2026-10-08"
const ID = "8f0c2a4e-1b3d-4c5e-9f6a-7b8c9d0e1f2a"

describe("parseFilterParams", () => {
  it("lee los filtros válidos", () => {
    expect(
      parseFilterParams({ periodo: "2026-09-15", tipo: "gasto", cuenta: ID, categoria: ID, q: "  taxi " }, TODAY),
    ).toEqual({ periodo: "2026-09-15", tipo: "gasto", cuenta: ID, categoria: ID, q: "taxi" })
  })

  it("ignora lo inválido", () => {
    expect(
      parseFilterParams(
        { periodo: "2026-02-30", tipo: "robo", cuenta: "1; drop table", categoria: "x", q: "   " },
        TODAY,
      ),
    ).toEqual({})
  })

  it("no acepta periodos futuros", () => {
    expect(parseFilterParams({ periodo: "2026-11-01" }, TODAY)).toEqual({})
  })

  it("usa el primer valor si se repite el parámetro", () => {
    expect(parseFilterParams({ tipo: ["ingreso", "gasto"] }, TODAY)).toEqual({ tipo: "ingreso" })
  })

  it("recorta búsquedas largas", () => {
    expect(parseFilterParams({ q: "a".repeat(100) }, TODAY).q).toHaveLength(60)
  })
})

describe("filtersHref", () => {
  it("arma la URL y quita los vacíos", () => {
    expect(filtersHref({ tipo: "gasto", q: "taxi" }, { q: "" })).toBe("/movimientos?tipo=gasto")
    expect(filtersHref({}, {})).toBe("/movimientos")
  })

  it("codifica la búsqueda", () => {
    expect(filtersHref({}, { q: "café & pan" })).toBe("/movimientos?q=caf%C3%A9+%26+pan")
  })
})

describe("hasActiveFilters", () => {
  it("no cuenta el periodo como filtro", () => {
    expect(hasActiveFilters({ periodo: "2026-09-01" })).toBe(false)
    expect(hasActiveFilters({ cuenta: ID })).toBe(true)
  })
})
