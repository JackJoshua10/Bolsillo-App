import { ArrowUpRight } from "lucide-react"

import { BottomNav } from "@/components/bottom-nav"
import { AccountTile } from "@/components/finance/account-tile"
import { AmountDisplay } from "@/components/finance/amount-display"
import { Sparkline } from "@/components/finance/sparkline"
import { TransactionRow } from "@/components/finance/transaction-row"
import { ThemeToggle } from "@/components/theme-toggle"
import { demoAccounts, demoMonth, demoNetWorthTrend, demoTransactions, type DemoTransaction } from "@/lib/demo-data"

// Vista previa con datos de ejemplo: valida el diseño antes de conectar Supabase.
const DEMO_TODAY = "2026-09-25"

const dayFormat = new Intl.DateTimeFormat("es-PE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})

function dayLabel(date: string) {
  const diff = (Date.parse(DEMO_TODAY) - Date.parse(date)) / 86_400_000
  if (diff === 0) return "Hoy"
  if (diff === 1) return "Ayer"
  return dayFormat.format(new Date(date))
}

function groupByDay(items: DemoTransaction[]) {
  const groups = new Map<string, DemoTransaction[]>()
  for (const t of items) groups.set(t.date, [...(groups.get(t.date) ?? []), t])
  return [...groups.entries()]
}

export default function HomePage() {
  const netWorth = demoAccounts.reduce((sum, a) => sum + a.balanceCents, 0)
  const budgetUsed = demoMonth.spentCents / demoMonth.budgetCents

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+6rem)]">
        <header className="flex items-center justify-between px-5 pt-5">
          <div>
            <p className="text-xs text-muted-foreground">Personal</p>
            <h1 className="text-lg font-semibold">Hola, Jack</h1>
          </div>
          <ThemeToggle />
        </header>

        <p className="mx-5 mt-4 rounded-md border border-dashed border-line px-3 py-2 text-[11px] text-muted-foreground">
          Vista previa con datos de ejemplo
        </p>

        {/* Patrimonio neto */}
        <section className="px-5 pt-8">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Patrimonio neto</p>
          <AmountDisplay cents={netWorth} currency="PEN" size="hero" className="mt-2 block" />
          <p className="mt-2 flex items-center gap-1 text-xs text-brand-text">
            <ArrowUpRight className="size-3.5" />
            <span className="num">+{demoMonth.lastMonthDeltaPct.toFixed(1)}%</span>
            <span className="text-muted-foreground">vs. mes anterior</span>
          </p>
          <Sparkline values={demoNetWorthTrend} className="mt-5" />
        </section>

        {/* Gasto del mes */}
        <section className="mx-5 mt-8 border-y border-line py-4">
          <div className="flex items-baseline justify-between">
            <p className="text-xs text-muted-foreground">Gastado en septiembre</p>
            <p className="text-xs text-muted-foreground">
              de <AmountDisplay cents={demoMonth.budgetCents} currency="PEN" className="text-xs" />
            </p>
          </div>
          <AmountDisplay cents={demoMonth.spentCents} currency="PEN" size="lg" className="mt-1 block" />
          <div className="mt-3 h-px w-full bg-line">
            <div
              className="h-0.5 -translate-y-px bg-brand-text"
              style={{ width: `${Math.min(1, budgetUsed) * 100}%` }}
            />
          </div>
        </section>

        {/* Cuentas: paneles tonales separados por líneas finas */}
        <section className="mt-8">
          <h2 className="px-5 text-xs tracking-wide text-muted-foreground uppercase">Cuentas</h2>
          <div className="mt-3 flex [scrollbar-width:none] gap-px overflow-x-auto border-y border-line bg-line">
            {demoAccounts.map((a) => (
              <AccountTile key={a.id} {...a} className="w-44 shrink-0 first:w-48 first:pl-5" />
            ))}
          </div>
        </section>

        {/* Movimientos recientes */}
        <section className="mt-8 px-5">
          <h2 className="text-xs tracking-wide text-muted-foreground uppercase">Movimientos</h2>
          {groupByDay(demoTransactions).map(([date, items]) => (
            <div key={date} className="mt-4">
              <p className="text-[11px] text-muted-foreground capitalize">{dayLabel(date)}</p>
              <ul className="mt-1">
                {items.map((t, i) => (
                  <TransactionRow key={t.id} {...t} isFirst={i === 0} isLast={i === items.length - 1} />
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>

      <BottomNav />
    </>
  )
}
