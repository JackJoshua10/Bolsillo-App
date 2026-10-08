import { Plus } from "lucide-react"
import Link from "next/link"

import { AccountTile } from "@/components/finance/account-tile"
import { AmountDisplay } from "@/components/finance/amount-display"
import { TransactionList } from "@/components/finance/transaction-list"
import { monthRange, todayISO } from "@/lib/dates"
import { getProfile } from "@/server/auth"
import {
  getActiveSpaceId,
  getMonthSummary,
  listAccounts,
  listCategories,
  listRecentTransactions,
} from "@/server/finance"
import { WALLET_LABEL } from "@/types/finance"

export default async function HomePage() {
  const profile = await getProfile()
  const spaceId = await getActiveSpaceId()
  const today = todayISO()
  const range = monthRange(today, profile.month_start_day)

  const [accounts, categories, recent, month] = await Promise.all([
    listAccounts(spaceId),
    listCategories(spaceId),
    listRecentTransactions(spaceId, 15),
    getMonthSummary(spaceId, range),
  ])

  const firstName = profile.display_name?.split(" ")[0]
  // Sin tipo de cambio todavía: se suman por moneda (la tarjeta cuenta en negativo)
  const netWorth = { PEN: 0, USD: 0 }
  for (const a of accounts) netWorth[a.currency] += a.balanceCents
  const hasUSD = accounts.some((a) => a.currency === "USD")

  return (
    <>
      <header className="px-5 pt-5">
        <p className="text-xs text-muted-foreground">Personal</p>
        <h1 className="text-lg font-semibold">{firstName ? `Hola, ${firstName}` : "Hola"}</h1>
      </header>

      {/* Patrimonio neto */}
      <section className="px-5 pt-8">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">Patrimonio neto</p>
        <AmountDisplay cents={netWorth.PEN} currency="PEN" size="hero" className="mt-2 block" />
        {hasUSD && (
          <AmountDisplay cents={netWorth.USD} currency="USD" size="lg" className="mt-1 block text-muted-foreground" />
        )}
        <p className="mt-2 text-xs text-muted-foreground">Lo que tienes menos lo que debes en tus tarjetas.</p>
      </section>

      {/* Mes actual */}
      <section className="mx-5 mt-8 grid grid-cols-2 border-y border-line">
        <div className="border-r border-line py-4 pr-4">
          <p className="text-xs text-muted-foreground">Gastado en {range.label}</p>
          <AmountDisplay cents={month.expenseCents.PEN} currency="PEN" size="lg" className="mt-1 block" />
        </div>
        <div className="py-4 pl-4">
          <p className="text-xs text-muted-foreground">Ingresos</p>
          <AmountDisplay
            cents={month.incomeCents.PEN}
            currency="PEN"
            size="lg"
            className={month.incomeCents.PEN ? "mt-1 block text-brand-text" : "mt-1 block"}
          />
        </div>
      </section>

      {/* Cuentas: paneles tonales separados por líneas finas */}
      <section className="mt-8">
        <h2 className="px-5 text-xs tracking-wide text-muted-foreground uppercase">Cuentas</h2>
        <div className="mt-3 flex [scrollbar-width:none] gap-px overflow-x-auto border-y border-line bg-line">
          {accounts.map((a) => (
            <AccountTile
              key={a.id}
              name={a.name}
              subtitle={a.wallet ? WALLET_LABEL[a.wallet] : undefined}
              type={a.type}
              currency={a.currency}
              balanceCents={a.balanceCents}
              creditLimitCents={a.creditLimitCents}
              className="w-44 shrink-0 first:w-48 first:pl-5"
            />
          ))}
        </div>
      </section>

      {/* Movimientos recientes */}
      <section className="mt-8 px-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs tracking-wide text-muted-foreground uppercase">Movimientos</h2>
          {recent.length > 0 && (
            <Link href="/movimientos" className="text-xs text-brand-text underline-offset-4 hover:underline">
              Ver todo
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="mt-4 flex items-center gap-3 border border-dashed border-line px-4 py-5 text-sm text-muted-foreground">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <Plus className="size-4" strokeWidth={2.5} />
            </span>
            Aún no hay movimientos. Toca el + para registrar tu primer gasto.
          </div>
        ) : (
          <TransactionList transactions={recent} accounts={accounts} categories={categories} today={today} />
        )}
      </section>
    </>
  )
}
