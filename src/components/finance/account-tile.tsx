import { Banknote, CreditCard, Landmark, PiggyBank, Wallet, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Currency } from "@/lib/money"
import type { AccountType } from "@/types/finance"
import { AmountDisplay } from "./amount-display"

const ICONS: Record<AccountType, LucideIcon> = {
  cash: Banknote,
  wallet: Wallet,
  bank: Landmark,
  credit_card: CreditCard,
  savings: PiggyBank,
}

interface AccountTileProps {
  name: string
  subtitle?: string
  type: AccountType
  currency: Currency
  balanceCents: number
  creditLimitCents?: number | null
  className?: string
}

export function AccountTile({
  name,
  subtitle,
  type,
  currency,
  balanceCents,
  creditLimitCents,
  className,
}: AccountTileProps) {
  const Icon = ICONS[type]
  const debt = Math.abs(Math.min(0, balanceCents))
  const used = creditLimitCents ? Math.min(1, debt / creditLimitCents) : 0

  return (
    <div className={cn("flex flex-col gap-3 bg-surface p-4", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 shrink-0" strokeWidth={1.75} />
        <span className="truncate text-xs">
          {name}
          {subtitle && <span className="opacity-70"> · {subtitle}</span>}
        </span>
      </div>

      <AmountDisplay cents={balanceCents} currency={currency} size="lg" className="text-xl" />

      {type === "credit_card" && creditLimitCents ? (
        <div className="flex flex-col gap-1.5">
          <div className="h-px w-full bg-line">
            <div
              className={cn("h-px", used > 0.8 ? "bg-warning" : "bg-brand-text")}
              style={{ width: `${used * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground">
            Disponible <AmountDisplay cents={creditLimitCents - debt} currency={currency} className="text-[11px]" />
          </span>
        </div>
      ) : null}
    </div>
  )
}
