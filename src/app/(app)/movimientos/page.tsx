import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AmountDisplay } from "@/components/finance/amount-display"
import { TransactionFilters } from "@/components/finance/transaction-filters"
import { TransactionList } from "@/components/finance/transaction-list"
import { addDays, monthRange, todayISO } from "@/lib/dates"
import { CURRENCIES, type Currency } from "@/lib/money"
import { filtersHref, hasActiveFilters, parseFilterParams, TYPE_PARAM } from "@/lib/transaction-filters"
import { getProfile } from "@/server/auth"
import { getActiveSpaceId, listAccounts, listCategories, listTransactions } from "@/server/finance"

export const metadata: Metadata = { title: "Movimientos" }

export default async function TransactionsPage(props: PageProps<"/movimientos">) {
  const profile = await getProfile()
  const spaceId = await getActiveSpaceId()
  const today = todayISO()
  const params = parseFilterParams(await props.searchParams, today)

  const range = monthRange(params.periodo ?? today, profile.month_start_day)
  const prevPeriod = addDays(range.start, -1)
  const nextPeriod = range.end <= today ? range.end : null
  const currentStart = monthRange(today, profile.month_start_day).start
  const year = range.start.slice(0, 4)
  const periodLabel = year === today.slice(0, 4) ? range.label : `${range.label} ${year}`
  // Al buscar por texto se busca en todos los meses
  const searching = Boolean(params.q)

  const [accounts, categories] = await Promise.all([listAccounts(spaceId), listCategories(spaceId)])
  const transactions = await listTransactions(spaceId, {
    range: searching ? undefined : range,
    type: params.tipo ? TYPE_PARAM[params.tipo] : undefined,
    accountId: accounts.some((a) => a.id === params.cuenta) ? params.cuenta : undefined,
    categoryId: categories.some((c) => c.id === params.categoria) ? params.categoria : undefined,
    query: params.q,
  })

  const totals = { expense: { PEN: 0, USD: 0 }, income: { PEN: 0, USD: 0 } }
  for (const t of transactions) {
    if (t.type === "expense" || t.type === "income") totals[t.type][t.currency] += t.amountCents
  }
  const currencies = CURRENCIES.filter(
    (c: Currency) => c === "PEN" || totals.expense[c] !== 0 || totals.income[c] !== 0,
  )

  return (
    <>
      <header className="px-5 pt-5">
        <h1 className="text-lg font-semibold">Movimientos</h1>
      </header>

      {/* Periodo */}
      <nav aria-label="Periodo" className="mt-4 flex items-center justify-between px-3">
        {searching ? (
          <p className="w-full px-2 text-center text-sm text-muted-foreground">Buscando en todos los meses</p>
        ) : (
          <>
            <Link
              href={filtersHref(params, { periodo: prevPeriod })}
              scroll={false}
              aria-label="Periodo anterior"
              className="flex size-10 items-center justify-center text-muted-foreground"
            >
              <ChevronLeft className="size-5" />
            </Link>
            <p className="text-sm font-medium first-letter:uppercase">{periodLabel}</p>
            {nextPeriod ? (
              <Link
                href={filtersHref(params, { periodo: nextPeriod === currentStart ? undefined : nextPeriod })}
                scroll={false}
                aria-label="Periodo siguiente"
                className="flex size-10 items-center justify-center text-muted-foreground"
              >
                <ChevronRight className="size-5" />
              </Link>
            ) : (
              <span aria-hidden className="flex size-10 items-center justify-center text-muted-foreground/30">
                <ChevronRight className="size-5" />
              </span>
            )}
          </>
        )}
      </nav>

      <div className="mt-2">
        <TransactionFilters params={params} accounts={accounts} categories={categories} />
      </div>

      {/* Totales de lo que se ve */}
      <section className="mx-5 mt-5 grid grid-cols-2 border-y border-line">
        <div className="border-r border-line py-3 pr-4">
          <p className="text-xs text-muted-foreground">Gastos</p>
          {currencies.map((c) => (
            <AmountDisplay key={c} cents={totals.expense[c]} currency={c} size="md" className="block" />
          ))}
        </div>
        <div className="py-3 pl-4">
          <p className="text-xs text-muted-foreground">Ingresos</p>
          {currencies.map((c) => (
            <AmountDisplay
              key={c}
              cents={totals.income[c]}
              currency={c}
              size="md"
              className={totals.income[c] ? "block text-brand-text" : "block"}
            />
          ))}
        </div>
      </section>

      <section className="px-5 pb-4">
        {transactions.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            {hasActiveFilters(params) ? "No hay movimientos con estos filtros." : "No hay movimientos en este periodo."}
          </p>
        ) : (
          <>
            <TransactionList transactions={transactions} accounts={accounts} categories={categories} today={today} />
            <p className="mt-6 text-center text-xs text-muted-foreground">
              {transactions.length === 1 ? "1 movimiento" : `${transactions.length} movimientos`}
            </p>
          </>
        )}
      </section>
    </>
  )
}
