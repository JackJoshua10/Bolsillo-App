import { cn } from "@/lib/utils"
import type { TransactionItem } from "@/types/finance"
import { AmountDisplay } from "./amount-display"

interface TransactionRowProps {
  transaction: TransactionItem
  isFirst?: boolean
  isLast?: boolean
}

/**
 * Fila del "ledger spine": una línea vertical fina con un nodo por movimiento.
 * El nodo es citrino en ingresos y neutro en gastos.
 */
export function TransactionRow({ transaction: t, isFirst, isLast }: TransactionRowProps) {
  const isTransfer = t.type === "transfer"
  const title = t.description || t.categoryName || (isTransfer ? "Transferencia" : "Movimiento")
  const subtitle = isTransfer
    ? `${t.accountLabel} → ${t.toAccountLabel ?? ""}`
    : [t.description ? t.categoryName : null, t.accountLabel].filter(Boolean).join(" · ")

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
          t.type === "income" ? "border-brand-text bg-brand" : "border-muted-foreground/50 bg-background",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <AmountDisplay
        cents={t.amountCents}
        currency={t.currency}
        kind={t.type === "expense" ? "expense" : t.type === "income" ? "income" : "neutral"}
        size="sm"
        className={isTransfer ? "text-muted-foreground" : undefined}
      />
    </li>
  )
}
