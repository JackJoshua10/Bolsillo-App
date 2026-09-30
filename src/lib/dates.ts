/**
 * Fechas de calendario como texto ISO "YYYY-MM-DD" (sin hora), en hora de Lima.
 * La aritmética se hace en UTC para no depender de la zona del servidor.
 */

export const APP_TIME_ZONE = "America/Lima"

/** Hoy en Lima como "YYYY-MM-DD". */
export function todayISO(now = new Date(), timeZone = APP_TIME_ZONE) {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now)
}

function toUTC(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function fromUTC(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number) {
  const date = toUTC(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return fromUTC(date)
}

/** Día `day` del mes (year, month0), recortado al último día si el mes es más corto. */
function clampedDay(year: number, month0: number, day: number) {
  const last = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate()
  return fromUTC(new Date(Date.UTC(year, month0, Math.min(day, last))))
}

export interface MonthRange {
  /** Primer día incluido */
  start: string
  /** Primer día NO incluido */
  end: string
  /** "setiembre" o "15 set. – 14 oct." si el mes empieza otro día */
  label: string
}

const monthName = new Intl.DateTimeFormat("es-PE", { month: "long", timeZone: "UTC" })
const shortDate = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", timeZone: "UTC" })

/**
 * El "mes" que contiene `today`. Con `startDay` = 1 es el mes calendario;
 * con otro día (por ejemplo, el de cobro) va de ese día al anterior del mes siguiente.
 */
export function monthRange(today: string, startDay = 1): MonthRange {
  const t = toUTC(today)
  const y = t.getUTCFullYear()
  const m = t.getUTCMonth()

  const thisStart = clampedDay(y, m, startDay)
  const [startY, startM] = today >= thisStart ? [y, m] : [y, m - 1]
  const start = clampedDay(startY, startM, startDay)
  const end = clampedDay(startY, startM + 1, startDay)

  const label =
    startDay === 1
      ? monthName.format(toUTC(start)).toLowerCase()
      : `${shortDate.format(toUTC(start))} – ${shortDate.format(toUTC(addDays(end, -1)))}`

  return { start, end, label }
}

const weekdayDate = new Intl.DateTimeFormat("es-PE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})

/** "Hoy", "Ayer" o "mar, 23 sept". */
export function dayLabel(date: string, today: string) {
  if (date === today) return "Hoy"
  if (date === addDays(today, -1)) return "Ayer"
  return weekdayDate.format(toUTC(date))
}
