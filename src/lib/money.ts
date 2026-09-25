/**
 * Dinero en Bolsillo: siempre enteros en céntimos + moneda explícita.
 * Solo se convierte a texto en la UI. Ver docs/03-modelo-de-datos.md
 */

export const CURRENCIES = ["PEN", "USD"] as const
export type Currency = (typeof CURRENCIES)[number]

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  PEN: "S/",
  USD: "US$",
}

const MINUS = "\u2212" // signo menos tipográfico, alinea mejor que el guion

const numberFormat = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export type SignDisplay = "auto" | "always" | "never"

export interface FormatMoneyOptions {
  /** "always" muestra "+" en positivos (ingresos). Por defecto "auto". */
  sign?: SignDisplay
  /** Omite el símbolo de moneda. */
  hideSymbol?: boolean
}

/** 123450 → "S/ 1,234.50" */
export function formatMoney(cents: number, currency: Currency, opts: FormatMoneyOptions = {}) {
  const { sign = "auto", hideSymbol = false } = opts
  const amount = numberFormat.format(Math.abs(cents) / 100)
  const body = hideSymbol ? amount : `${CURRENCY_SYMBOL[currency]} ${amount}`

  if (sign === "never" || cents === 0) return body
  if (cents < 0) return `${MINUS}${body}`
  return sign === "always" ? `+${body}` : body
}

/**
 * Convierte lo que escribe el usuario a céntimos. Devuelve null si no es válido.
 * Acepta "12", "12.5", "12,50", "1,234.56", "1.234,56", "S/ 12".
 * Regla: si hay "." y ",", el último es el decimal. Si hay uno solo, es decimal
 * cuando le siguen 1–2 dígitos; si le siguen 3, es separador de miles.
 */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/S\/|US\$|\$|\s/gi, "")
  if (!/^\d[\d.,]*$/.test(cleaned)) return null

  const lastDot = cleaned.lastIndexOf(".")
  const lastComma = cleaned.lastIndexOf(",")
  let decimalSep: "." | "," | null = null

  if (lastDot !== -1 && lastComma !== -1) {
    decimalSep = lastDot > lastComma ? "." : ","
  } else {
    const sep = lastDot !== -1 ? "." : lastComma !== -1 ? "," : null
    if (sep) {
      const occurrences = cleaned.split(sep).length - 1
      const digitsAfter = cleaned.length - cleaned.lastIndexOf(sep) - 1
      if (occurrences === 1 && digitsAfter <= 2) decimalSep = sep
    }
  }

  let intPart = cleaned
  let fracPart = ""
  if (decimalSep) {
    const idx = cleaned.lastIndexOf(decimalSep)
    intPart = cleaned.slice(0, idx)
    fracPart = cleaned.slice(idx + 1)
    if (!/^\d{0,2}$/.test(fracPart)) return null
  }

  const groupSep = decimalSep === "," ? "." : ","
  const otherSep = decimalSep ?? ""
  if (otherSep && intPart.includes(otherSep)) return null

  // Con separador de miles, los grupos deben ser 1–3 dígitos y luego de 3 en 3
  const groups = intPart.split(decimalSep ? groupSep : /[.,]/)
  if (groups.length > 1 && !groups.every((g, i) => (i === 0 ? /^\d{1,3}$/ : /^\d{3}$/).test(g))) {
    return null
  }
  const intDigits = groups.join("")
  if (!/^\d+$/.test(intDigits)) return null

  const cents = Number(intDigits) * 100 + Number(fracPart.padEnd(2, "0") || 0)
  return Number.isSafeInteger(cents) ? cents : null
}

/** Convierte céntimos entre monedas con un tipo de cambio (1 USD = rate PEN). */
export function convertCents(cents: number, from: Currency, to: Currency, usdToPen: number) {
  if (from === to) return cents
  return Math.round(from === "USD" ? cents * usdToPen : cents / usdToPen)
}
