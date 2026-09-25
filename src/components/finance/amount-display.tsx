import { cn } from "@/lib/utils"
import { type Currency, formatMoney } from "@/lib/money"

export type AmountKind = "expense" | "income" | "neutral"

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
  hero: "text-[2.75rem] leading-none tracking-tight",
}

interface AmountDisplayProps {
  cents: number
  currency: Currency
  /** expense → "−" en color de texto; income → "+" en citrino. */
  kind?: AmountKind
  size?: keyof typeof sizes
  className?: string
}

/** Monto con fuente mono tabular. Los gastos no van en rojo (ver docs/02-diseno.md). */
export function AmountDisplay({ cents, currency, kind = "neutral", size = "md", className }: AmountDisplayProps) {
  const signed = kind === "expense" ? -Math.abs(cents) : kind === "income" ? Math.abs(cents) : cents
  const text = formatMoney(signed, currency, { sign: kind === "income" ? "always" : "auto" })

  return (
    <span className={cn("num whitespace-nowrap", sizes[size], kind === "income" && "text-brand-text", className)}>
      {text}
    </span>
  )
}
