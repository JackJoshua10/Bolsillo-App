import { cn } from "@/lib/utils"
import type { Currency } from "@/lib/money"
import { AmountDisplay } from "./amount-display"

interface TransactionRowProps {
  type: "expense" | "income" | "transfer"
  description: string
  category: string
  account: string
  cents: number
  currency: Currency
  isFirst?: boolean
  isLast?: boolean
}

/**
 * Fila del "ledger spine": una línea vertical fina con un nodo por movimiento.
 * El nodo es citrino en ingresos y neutro en gastos.
 */
export function TransactionRow({
  type,
  description,
  category,
  account,
  cents,
  currency,
  isFirst,
  isLast,
}: TransactionRowProps) {
  return (
    <li className="relative flex items-center gap-4 py-3 pl-6">
      <span
        aria-hidden
        className={cn(
          "absolute left-[5px] w-px bg-line",
          isFirst && isLast ? "hidden" : isFirst ? "top-1/2 bottom-0" : isLast ? "top-0 bottom-1/2" : "inset-y-0",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 left-0 size-[11px] -translate-y-1/2 rounded-full border",
          type === "income" ? "border-brand-text bg-brand" : "border-muted-foreground/50 bg-background",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{description}</p>
        <p className="truncate text-xs text-muted-foreground">
          {category} · {account}
        </p>
      </div>
      <AmountDisplay
        cents={cents}
        currency={currency}
        kind={type === "transfer" ? "neutral" : type}
        size="sm"
        className={type === "transfer" ? "text-muted-foreground" : undefined}
      />
    </li>
  )
}
