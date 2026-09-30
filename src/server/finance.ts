import "server-only"

import { cache } from "react"

import type { MonthRange } from "@/lib/dates"
import type { Currency } from "@/lib/money"
import { createClient } from "@/lib/supabase/server"
import { accountLabel, type Account, type Category, type TransactionItem } from "@/types/finance"
import { getProfile } from "./auth"

/** Espacio activo del usuario (por ahora, siempre el Personal). */
export const getActiveSpaceId = cache(async () => {
  const profile = await getProfile()
  if (!profile.default_space_id) throw new Error("El usuario no tiene espacio por defecto")
  return profile.default_space_id
})

export const listAccounts = cache(async (spaceId: string): Promise<Account[]> => {
  const supabase = await createClient()
  const [{ data: accounts, error }, { data: balances, error: balancesError }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, type, currency, institution, wallet, credit_limit_cents, statement_day, due_day")
      .eq("space_id", spaceId)
      .is("archived_at", null)
      .order("sort_order")
      .order("created_at"),
    supabase.from("account_balances").select("account_id, balance_cents").eq("space_id", spaceId),
  ])
  if (error) throw error
  if (balancesError) throw balancesError

  const balanceById = new Map(balances.map((b) => [b.account_id as string, Number(b.balance_cents)]))

  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    currency: a.currency,
    institution: a.institution,
    wallet: a.wallet,
    creditLimitCents: a.credit_limit_cents === null ? null : Number(a.credit_limit_cents),
    statementDay: a.statement_day,
    dueDay: a.due_day,
    balanceCents: balanceById.get(a.id) ?? 0,
  }))
})

export const listCategories = cache(async (spaceId: string): Promise<Category[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, kind, name, icon")
    .eq("space_id", spaceId)
    .is("archived_at", null)
    .order("sort_order")
  if (error) throw error
  return data
})

interface TransactionRow {
  id: string
  type: TransactionItem["type"]
  amount_cents: number
  currency: Currency
  description: string | null
  occurred_on: string
  category: { name: string; icon: string | null } | null
  account: { name: string; wallet: Account["wallet"] } | null
  to_account: { name: string; wallet: Account["wallet"] } | null
}

export async function listRecentTransactions(spaceId: string, limit = 15): Promise<TransactionItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `id, type, amount_cents, currency, description, occurred_on,
       category:categories(name, icon),
       account:accounts!transactions_account_id_fkey(name, wallet),
       to_account:accounts!transactions_to_account_id_fkey(name, wallet)`,
    )
    .eq("space_id", spaceId)
    .is("deleted_at", null)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
    .overrideTypes<TransactionRow[], { merge: false }>()
  if (error) throw error

  return data.map((t) => ({
    id: t.id,
    type: t.type,
    amountCents: Number(t.amount_cents),
    currency: t.currency,
    description: t.description,
    occurredOn: t.occurred_on,
    categoryName: t.category?.name ?? null,
    categoryIcon: t.category?.icon ?? null,
    accountLabel: t.account ? accountLabel(t.account) : "",
    toAccountLabel: t.to_account ? accountLabel(t.to_account) : null,
  }))
}

export interface MonthSummary {
  expenseCents: Record<Currency, number>
  incomeCents: Record<Currency, number>
}

/** Gastos e ingresos del periodo (los montos se suman por moneda, sin convertir). */
export async function getMonthSummary(spaceId: string, range: MonthRange): Promise<MonthSummary> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount_cents, currency")
    .eq("space_id", spaceId)
    .in("type", ["expense", "income"])
    .is("deleted_at", null)
    .gte("occurred_on", range.start)
    .lt("occurred_on", range.end)
  if (error) throw error

  const summary: MonthSummary = { expenseCents: { PEN: 0, USD: 0 }, incomeCents: { PEN: 0, USD: 0 } }
  for (const t of data) {
    const bucket = t.type === "expense" ? summary.expenseCents : summary.incomeCents
    bucket[t.currency as Currency] += Number(t.amount_cents)
  }
  return summary
}
