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
  account_id: string
  to_account_id: string | null
  category_id: string | null
  amount_cents: number
  currency: Currency
  to_amount_cents: number | null
  description: string | null
  occurred_on: string
  category: { name: string; icon: string | null } | null
  account: { name: string; wallet: Account["wallet"] } | null
  to_account: { name: string; wallet: Account["wallet"]; currency: Currency } | null
}

export interface TransactionFilters {
  /** Rango de fechas: `start` incluido, `end` excluido */
  range?: Pick<MonthRange, "start" | "end">
  type?: TransactionItem["type"]
  /** Movimientos que salen de o llegan a esta cuenta */
  accountId?: string
  categoryId?: string
  /** Busca en la descripción */
  query?: string
  limit?: number
}

/** Escapa los comodines de LIKE para buscar el texto tal cual. */
function likePattern(text: string) {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

export async function listTransactions(spaceId: string, filters: TransactionFilters = {}): Promise<TransactionItem[]> {
  const supabase = await createClient()
  let request = supabase
    .from("transactions")
    .select(
      `id, type, account_id, to_account_id, category_id, amount_cents, currency, to_amount_cents, description, occurred_on,
       category:categories(name, icon),
       account:accounts!transactions_account_id_fkey(name, wallet),
       to_account:accounts!transactions_to_account_id_fkey(name, wallet, currency)`,
    )
    .eq("space_id", spaceId)
    .is("deleted_at", null)

  if (filters.range) request = request.gte("occurred_on", filters.range.start).lt("occurred_on", filters.range.end)
  if (filters.type) request = request.eq("type", filters.type)
  if (filters.accountId) {
    request = request.or(`account_id.eq.${filters.accountId},to_account_id.eq.${filters.accountId}`)
  }
  if (filters.categoryId) request = request.eq("category_id", filters.categoryId)
  if (filters.query) request = request.ilike("description", likePattern(filters.query))

  const { data, error } = await request
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 500)
    .overrideTypes<TransactionRow[], { merge: false }>()
  if (error) throw error

  return data.map((t) => {
    const crossCurrency = t.to_account && t.to_account.currency !== t.currency
    return {
      id: t.id,
      type: t.type,
      accountId: t.account_id,
      toAccountId: t.to_account_id,
      categoryId: t.category_id,
      amountCents: Number(t.amount_cents),
      currency: t.currency,
      description: t.description,
      occurredOn: t.occurred_on,
      categoryName: t.category?.name ?? null,
      categoryIcon: t.category?.icon ?? null,
      accountLabel: t.account ? accountLabel(t.account) : "",
      toAccountLabel: t.to_account ? accountLabel(t.to_account) : null,
      toAmountCents: crossCurrency ? Number(t.to_amount_cents) : null,
      toCurrency: crossCurrency ? t.to_account!.currency : null,
    }
  })
}

export function listRecentTransactions(spaceId: string, limit = 15) {
  return listTransactions(spaceId, { limit })
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
