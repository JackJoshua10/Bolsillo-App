import { describe, expect, it } from "vitest"

import { convertCents, formatCompactMoney, formatMoney, impliedUsdToPen, parseAmountToCents } from "./money"

describe("formatMoney", () => {
  it("formatea soles y dólares", () => {
    expect(formatMoney(123450, "PEN")).toBe("S/ 1,234.50")
    expect(formatMoney(999, "USD")).toBe("US$ 9.99")
  })

  it("maneja signos", () => {
    expect(formatMoney(-1250, "PEN")).toBe("\u2212S/ 12.50")
    expect(formatMoney(1250, "PEN", { sign: "always" })).toBe("+S/ 12.50")
    expect(formatMoney(-1250, "PEN", { sign: "never" })).toBe("S/ 12.50")
    expect(formatMoney(0, "PEN", { sign: "always" })).toBe("S/ 0.00")
  })

  it("puede ocultar el símbolo", () => {
    expect(formatMoney(500, "PEN", { hideSymbol: true })).toBe("5.00")
  })
})

describe("parseAmountToCents", () => {
  it.each([
    ["12", 1200],
    ["12.5", 1250],
    ["12,50", 1250],
    ["0.05", 5],
    ["1,234.56", 123456],
    ["1.234,56", 123456],
    ["1,500", 150000],
    ["1.500", 150000],
    ["1,234,567", 123456700],
    ["S/ 12.30", 1230],
    ["US$ 7", 700],
    [" 45 ", 4500],
    ["12.", 1200],
  ])("%s → %i", (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected)
  })

  it.each(["", "abc", "-5", "12.345.6", "1,2,3.4.5", "12.3.4", "1.234.56,7,8"])("rechaza %j", (input) => {
    expect(parseAmountToCents(input)).toBeNull()
  })
})

describe("convertCents", () => {
  it("convierte con el tipo de cambio", () => {
    expect(convertCents(1000, "USD", "PEN", 3.75)).toBe(3750)
    expect(convertCents(3750, "PEN", "USD", 3.75)).toBe(1000)
    expect(convertCents(1234, "PEN", "PEN", 3.75)).toBe(1234)
  })
})

describe("impliedUsdToPen", () => {
  it("calcula el tipo de cambio en ambos sentidos", () => {
    // Compro 100 dólares pagando S/ 375.50
    expect(impliedUsdToPen(37550, "PEN", 10000, "USD")).toBe(3.755)
    // Vendo 100 dólares y recibo S/ 371.20
    expect(impliedUsdToPen(10000, "USD", 37120, "PEN")).toBe(3.712)
  })

  it("redondea a 6 decimales", () => {
    expect(impliedUsdToPen(10000, "PEN", 2667, "USD")).toBe(3.749531)
  })

  it("devuelve null en la misma moneda o sin montos", () => {
    expect(impliedUsdToPen(1000, "PEN", 1000, "PEN")).toBeNull()
    expect(impliedUsdToPen(0, "PEN", 1000, "USD")).toBeNull()
  })
})

describe("formatCompactMoney", () => {
  it("abrevia miles con k", () => {
    expect(formatCompactMoney(85000, "PEN")).toBe("S/ 850")
    expect(formatCompactMoney(123450, "PEN")).toBe("S/ 1.2k")
    expect(formatCompactMoney(1290000, "PEN")).toBe("S/ 13k")
    expect(formatCompactMoney(100000, "USD")).toBe("US$ 1k")
    expect(formatCompactMoney(0, "PEN")).toBe("S/ 0")
  })
})
