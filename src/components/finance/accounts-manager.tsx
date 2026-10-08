"use client"

import { Archive, Banknote, CreditCard, Landmark, PiggyBank, Plus, Wallet, type LucideIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { FormSheet } from "@/components/forms/form-sheet"
import { Button } from "@/components/ui/button"
import { nextMonthDay, shortDateLabel } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { archiveAccount, restoreAccount } from "@/server/actions/finance"
import { ACCOUNT_TYPE_LABEL, accountLabel, type Account, type AccountType } from "@/types/finance"
import { AccountForm, AdjustBalanceForm } from "./account-form"
import { AmountDisplay } from "./amount-display"

const ICONS: Record<AccountType, LucideIcon> = {
  cash: Banknote,
  wallet: Wallet,
  bank: Landmark,
  credit_card: CreditCard,
  savings: PiggyBank,
}

const GROUPS: { title: string; types: AccountType[] }[] = [
  { title: "Efectivo y bancos", types: ["cash", "bank", "wallet"] },
  { title: "Tarjetas de crédito", types: ["credit_card"] },
  { title: "Ahorros", types: ["savings"] },
]

interface AccountsManagerProps {
  accounts: Account[]
  archived: Account[]
  today: string
}

/** Lista de cuentas con hojas para agregar, editar, ajustar saldo y archivar. */
export function AccountsManager({ accounts, archived, today }: AccountsManagerProps) {
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<string>()
  const [editing, setEditing] = useState(false)
  // Siempre la versión más reciente (los saldos cambian al ajustar)
  const selected = accounts.find((a) => a.id === selectedId)

  function saved(message: string) {
    toast.success(message)
    setCreating(false)
    setEditing(false)
  }

  async function archive(account: Account) {
    const result = await archiveAccount(account.id)
    if (!result?.ok) {
      toast.error(result?.error ?? "No pudimos archivarla.")
      return
    }
    setEditing(false)
    toast.success(result.message, {
      action: { label: "Deshacer", onClick: () => restore(account.id, false) },
    })
  }

  async function restore(id: string, notify = true) {
    const result = await restoreAccount(id)
    if (!result?.ok) toast.error(result?.error ?? "No pudimos restaurarla.")
    else if (notify) toast.success(result.message)
  }

  return (
    <>
      {GROUPS.map(({ title, types }) => {
        const items = accounts.filter((a) => types.includes(a.type))
        if (items.length === 0) return null
        return (
          <section key={title} className="mt-6">
            <h2 className="px-5 text-xs tracking-wide text-muted-foreground uppercase">{title}</h2>
            <ul className="mt-2 border-y border-line">
              {items.map((account) => (
                <li key={account.id} className="border-b border-line bg-surface last:border-b-0">
                  <AccountRow
                    account={account}
                    today={today}
                    onSelect={() => {
                      setSelectedId(account.id)
                      setEditing(true)
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <div className="mt-6 px-5">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCreating(true)}
          className="h-11 w-full bg-surface text-base"
        >
          <Plus />
          Agregar cuenta
        </Button>
      </div>

      {archived.length > 0 && (
        <section className="mt-8">
          <h2 className="px-5 text-xs tracking-wide text-muted-foreground uppercase">Archivadas</h2>
          <ul className="mt-2 border-y border-line">
            {archived.map((account) => (
              <li
                key={account.id}
                className="flex items-center justify-between border-b border-line px-5 py-3 last:border-b-0"
              >
                <span className="truncate text-sm text-muted-foreground">{accountLabel(account)}</span>
                <button
                  type="button"
                  onClick={() => restore(account.id)}
                  className="text-xs text-brand-text underline-offset-4 hover:underline"
                >
                  Restaurar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <FormSheet
        open={creating}
        onOpenChange={setCreating}
        title="Nueva cuenta"
        description="Agrega efectivo, una cuenta bancaria, una tarjeta o ahorros"
      >
        <AccountForm onSaved={saved} />
      </FormSheet>

      <FormSheet
        open={editing && Boolean(selected)}
        onOpenChange={setEditing}
        title={selected ? accountLabel(selected) : "Cuenta"}
        description="Edita la cuenta, ajusta su saldo o archívala"
      >
        {selected && (
          <div className="flex flex-col gap-6">
            <p className="-mt-2 px-5 text-xs text-muted-foreground">
              {ACCOUNT_TYPE_LABEL[selected.type]} · {selected.currency === "PEN" ? "Soles" : "Dólares"}
            </p>
            <AccountForm key={selected.id} account={selected} onSaved={saved} />
            <div className="border-t border-line pt-5">
              <AdjustBalanceForm key={`${selected.id}-${selected.balanceCents}`} account={selected} onSaved={saved} />
            </div>
            <div className="border-t border-line px-5 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => archive(selected)}
                className="h-11 w-full text-muted-foreground"
              >
                <Archive />
                Archivar cuenta
              </Button>
            </div>
          </div>
        )}
      </FormSheet>
    </>
  )
}

function AccountRow({ account: a, today, onSelect }: { account: Account; today: string; onSelect: () => void }) {
  const Icon = ICONS[a.type]
  const isCard = a.type === "credit_card"
  const debt = Math.max(0, -a.balanceCents)
  const limit = a.creditLimitCents ?? 0
  const used = isCard && limit ? Math.min(1, debt / limit) : 0
  const subtitle = [
    a.institution && a.institution !== a.name ? a.institution : null,
    a.currency === "USD" ? "Dólares" : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <button type="button" onClick={onSelect} className="flex w-full flex-col gap-3 px-5 py-4 text-left">
      <div className="flex w-full items-center gap-3">
        <Icon className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{accountLabel(a)}</p>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <AmountDisplay cents={a.balanceCents} currency={a.currency} size="md" />
      </div>

      {isCard && (
        <div className="flex flex-col gap-1.5 pl-8">
          {limit > 0 && (
            <div className="h-px w-full bg-line">
              <div
                className={cn("h-px", used > 0.8 ? "bg-warning" : "bg-brand-text")}
                style={{ width: `${used * 100}%` }}
              />
            </div>
          )}
          <div className="flex flex-wrap justify-between gap-x-3 text-[11px] text-muted-foreground">
            {limit > 0 && (
              <span>
                Disponible{" "}
                <AmountDisplay cents={limit - debt} currency={a.currency} className="text-[11px] text-foreground" />
              </span>
            )}
            <span>
              {[
                a.statementDay ? `Corte ${shortDateLabel(nextMonthDay(today, a.statementDay))}` : null,
                a.dueDay ? `Pago ${shortDateLabel(nextMonthDay(today, a.dueDay))}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        </div>
      )}
    </button>
  )
}
