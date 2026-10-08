import { describe, expect, it } from "vitest"

import { addDays, dayLabel, monthRange, nextMonthDay, shortDateLabel, todayISO } from "./dates"

describe("todayISO", () => {
  it("usa la hora de Lima (UTC−5)", () => {
    // 2026-10-01 03:00 UTC = 2026-09-30 22:00 en Lima
    expect(todayISO(new Date("2026-10-01T03:00:00Z"))).toBe("2026-09-30")
    expect(todayISO(new Date("2026-10-01T06:00:00Z"))).toBe("2026-10-01")
  })
})

describe("addDays", () => {
  it("cruza meses y años", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01")
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31")
  })
})

describe("monthRange", () => {
  it("mes calendario", () => {
    expect(monthRange("2026-09-30")).toEqual({ start: "2026-09-01", end: "2026-10-01", label: "setiembre" })
    expect(monthRange("2026-12-15").end).toBe("2027-01-01")
  })

  it("mes desde el día de cobro", () => {
    expect(monthRange("2026-09-20", 15)).toMatchObject({ start: "2026-09-15", end: "2026-10-15" })
    expect(monthRange("2026-09-10", 15)).toMatchObject({ start: "2026-08-15", end: "2026-09-15" })
    expect(monthRange("2026-01-05", 15)).toMatchObject({ start: "2025-12-15", end: "2026-01-15" })
  })

  it("recorta días que no existen en meses cortos", () => {
    expect(monthRange("2026-02-27", 28)).toMatchObject({ start: "2026-01-28", end: "2026-02-28" })
    expect(monthRange("2026-02-28", 28)).toMatchObject({ start: "2026-02-28", end: "2026-03-28" })
  })

  it("etiqueta con rango si no empieza el 1", () => {
    expect(monthRange("2026-09-20", 15).label).toMatch(/^15 set.* – 14 oct/)
  })
})

describe("dayLabel", () => {
  it("hoy, ayer y fecha", () => {
    expect(dayLabel("2026-09-30", "2026-09-30")).toBe("Hoy")
    expect(dayLabel("2026-09-29", "2026-09-30")).toBe("Ayer")
    expect(dayLabel("2026-09-23", "2026-09-30")).toMatch(/23/)
  })
})

describe("nextMonthDay", () => {
  it("usa este mes si el día no pasó (hoy incluido)", () => {
    expect(nextMonthDay("2026-10-08", 15)).toBe("2026-10-15")
    expect(nextMonthDay("2026-10-08", 8)).toBe("2026-10-08")
  })

  it("pasa al mes siguiente si el día ya pasó", () => {
    expect(nextMonthDay("2026-10-20", 15)).toBe("2026-11-15")
    expect(nextMonthDay("2026-12-20", 5)).toBe("2027-01-05")
  })

  it("recorta al último día en meses cortos", () => {
    expect(nextMonthDay("2026-02-10", 31)).toBe("2026-02-28")
    expect(nextMonthDay("2026-01-31", 30)).toBe("2026-02-28")
  })
})

describe("shortDateLabel", () => {
  it("muestra día y mes", () => {
    expect(shortDateLabel("2026-10-15")).toMatch(/^15 oct/)
  })
})
