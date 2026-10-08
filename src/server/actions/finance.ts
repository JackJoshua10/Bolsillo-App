"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { fieldErrorsFrom, type FormState } from "@/lib/form-state"
import { createClient } from "@/lib/supabase/server"
import { todayISO } from "@/lib/dates"
import { impliedUsdToPen } from "@/lib/money"
import {
  accountCreateSchema,
  accountRuleErrors,
  accountUpdateSchema,
  balanceAdjustSchema,
  onboardingSchema,
  transactionSchema,
  transferSchema,
} from "@/schemas/finance"
import type { Account, PaymentMethod } from "@/types/finance"
import { getActiveSpaceId, listAccounts, listArchivedAccounts } from "../finance"

const GENERIC_ERROR = "No pudimos guardar. Revisa tu conexión e inténtalo de nuevo."

function str(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

/** Crea las cuentas iniciales elegidas en /bienvenida. */
export async function createInitialAccounts(_prev: FormState, formData: FormData): Promise<FormState> {
  const enabled = (key: string) => formData.get(`${key}_enabled`) === "on"
  const parsed = onboardingSchema.safeParse({
    cash: enabled("cash") ? { balance: str(formData, "cash_balance") } : undefined,
    bank: enabled("bank")
      ? {
          institution: str(formData, "bank_institution"),
          wallet: str(formData, "bank_wallet"),
          balance: str(formData, "bank_balance"),
        }
      : undefined,
    card: enabled("card")
      ? {
          name: str(formData, "card_name"),
          currency: str(formData, "card_currency") || "PEN",
          limit: str(formData, "card_limit"),
          debt: str(formData, "card_debt"),
          statementDay: str(formData, "card_statementDay"),
          dueDay: str(formData, "card_dueDay"),
        }
      : undefined,
  })
  if (!parsed.success) {
    const fieldErrors = fieldErrorsFrom(parsed.error)
    return { error: fieldErrors._form?.[0] ?? "Revisa los campos marcados.", fieldErrors }
  }

  const spaceId = await getActiveSpaceId()
  if ((await listAccounts(spaceId)).length > 0) redirect("/")

  const { cash, bank, card } = parsed.data
  const rows = []
  if (cash) {
    rows.push({
      space_id: spaceId,
      name: "Efectivo",
      type: "cash",
      currency: "PEN",
      opening_balance_cents: cash.balance,
    })
  }
  if (bank) {
    rows.push({
      space_id: spaceId,
      name: bank.institution,
      institution: bank.institution,
      type: "bank",
      currency: "PEN",
      wallet: bank.wallet || null,
      opening_balance_cents: bank.balance,
    })
  }
  if (card) {
    rows.push({
      space_id: spaceId,
      name: card.name,
      type: "credit_card",
      currency: card.currency,
      // La deuda se guarda como saldo negativo
      opening_balance_cents: -card.debt,
      credit_limit_cents: card.limit,
      statement_day: card.statementDay ?? null,
      due_day: card.dueDay ?? null,
    })
  }
  rows.forEach((row, i) => Object.assign(row, { sort_order: i }))

  const supabase = await createClient()
  const { error } = await supabase.from("accounts").insert(rows)
  if (error) return { error: GENERIC_ERROR }

  revalidatePath("/", "layout")
  redirect("/")
}

/** Medio de pago por defecto según la cuenta (BCP · Yape → yape, tarjeta → credit_card). */
function defaultPaymentMethod(account: Account): PaymentMethod | null {
  if (account.type === "cash") return "cash"
  if (account.type === "credit_card") return "credit_card"
  if (account.type === "bank") return account.wallet ?? null
  return null
}

/** Mensaje según el caso: pagar tarjeta, cambiar dólares o mover dinero. */
function transferMessage(from: Account, to: Account) {
  if (to.type === "credit_card") return "Pago de tarjeta registrado"
  if (from.currency !== to.currency) return "Cambio registrado"
  return "Transferencia registrada"
}

type Row = Record<string, unknown>
type Built = { row: Row; message: string } | { state: FormState }

/** Gasto o ingreso → columnas de `transactions`. */
function buildTransaction(formData: FormData, accounts: Account[]): Built {
  const parsed = transactionSchema.safeParse({
    type: str(formData, "type"),
    amount: str(formData, "amount"),
    accountId: str(formData, "accountId"),
    categoryId: str(formData, "categoryId"),
    description: str(formData, "description") || undefined,
    occurredOn: str(formData, "occurredOn"),
  })
  if (!parsed.success) return { state: { fieldErrors: fieldErrorsFrom(parsed.error) } }

  const { type, amount, accountId, categoryId, description, occurredOn } = parsed.data
  const account = accounts.find((a) => a.id === accountId)
  if (!account) return { state: { fieldErrors: { accountId: ["Elige una cuenta"] } } }

  return {
    row: {
      type,
      account_id: account.id,
      amount_cents: amount,
      currency: account.currency, // la base de datos igual la toma de la cuenta
      to_account_id: null,
      to_amount_cents: null,
      exchange_rate: null,
      category_id: categoryId,
      payment_method: defaultPaymentMethod(account),
      description: description ?? null,
      occurred_on: occurredOn,
    },
    message: type === "expense" ? "Gasto registrado" : "Ingreso registrado",
  }
}

/** Transferencia entre cuentas propias → columnas de `transactions`. */
function buildTransfer(formData: FormData, accounts: Account[]): Built {
  const parsed = transferSchema.safeParse({
    amount: str(formData, "amount"),
    toAmount: str(formData, "toAmount"),
    accountId: str(formData, "accountId"),
    toAccountId: str(formData, "toAccountId"),
    description: str(formData, "description") || undefined,
    occurredOn: str(formData, "occurredOn"),
  })
  if (!parsed.success) return { state: { fieldErrors: fieldErrorsFrom(parsed.error) } }

  const { amount, toAmount, accountId, toAccountId, description, occurredOn } = parsed.data
  const from = accounts.find((a) => a.id === accountId)
  const to = accounts.find((a) => a.id === toAccountId)
  if (!from) return { state: { fieldErrors: { accountId: ["Elige de dónde sale"] } } }
  if (!to) return { state: { fieldErrors: { toAccountId: ["Elige a dónde va"] } } }

  const crossCurrency = from.currency !== to.currency
  if (crossCurrency && toAmount <= 0) return { state: { fieldErrors: { toAmount: ["¿Cuánto recibiste?"] } } }

  return {
    row: {
      type: "transfer",
      account_id: from.id,
      amount_cents: amount,
      currency: from.currency,
      to_account_id: to.id,
      to_amount_cents: crossCurrency ? toAmount : amount,
      exchange_rate: crossCurrency ? impliedUsdToPen(amount, from.currency, toAmount, to.currency) : null,
      category_id: null,
      payment_method: from.type === "bank" ? "bank_transfer" : null,
      description: description ?? null,
      occurred_on: occurredOn,
    },
    message: transferMessage(from, to),
  }
}

/**
 * Crea o edita (si viene `id`) un gasto, ingreso o transferencia.
 * Al editar se reescriben todas las columnas, así se puede cambiar el tipo.
 */
export async function saveTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = str(formData, "id")
  const spaceId = await getActiveSpaceId()
  const accounts = await listAccounts(spaceId)

  const built =
    str(formData, "type") === "transfer" ? buildTransfer(formData, accounts) : buildTransaction(formData, accounts)
  if ("state" in built) return built.state

  const supabase = await createClient()
  if (id) {
    const { data, error } = await supabase
      .from("transactions")
      .update(built.row)
      .eq("id", id)
      .eq("space_id", spaceId)
      .is("deleted_at", null)
      .select("id")
    if (error || data.length === 0) return { error: GENERIC_ERROR }
  } else {
    const { error } = await supabase.from("transactions").insert({ ...built.row, space_id: spaceId, source: "app" })
    if (error) return { error: GENERIC_ERROR }
  }

  revalidatePath("/", "layout")
  return { ok: true, message: id ? "Cambios guardados" : built.message }
}

/** Borrado lógico: el movimiento deja de contar, pero se puede deshacer. */
async function setDeleted(id: string, deleted: boolean) {
  const spaceId = await getActiveSpaceId()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("transactions")
    .update({ deleted_at: deleted ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("space_id", spaceId)
    .select("id")
  if (error || data.length === 0) return { ok: false as const }

  revalidatePath("/", "layout")
  return { ok: true as const }
}

export async function deleteTransaction(id: string) {
  return setDeleted(id, true)
}

export async function restoreTransaction(id: string) {
  return setDeleted(id, false)
}

// ─────────────────────────────────────────────────────────────
// Cuentas
// ─────────────────────────────────────────────────────────────

interface AccountFieldsInput {
  name: string
  institution: string
  wallet: "" | "yape" | "plin"
  limit: number
  statementDay?: number
  dueDay?: number
}

/** Columnas editables según el tipo (la base de datos rechaza datos de tarjeta en otras cuentas). */
function accountColumns(type: Account["type"], currency: Account["currency"], v: AccountFieldsInput) {
  const isCard = type === "credit_card"
  const defaultName = type === "cash" ? (currency === "USD" ? "Dólares" : "Efectivo") : "Ahorros"
  return {
    name: v.name || v.institution || defaultName,
    institution: type === "cash" ? null : v.institution || null,
    // Yape y Plin solo existen en soles y van ligados a una cuenta bancaria
    wallet: type === "bank" && currency === "PEN" && v.wallet ? v.wallet : null,
    credit_limit_cents: isCard ? v.limit : null,
    statement_day: isCard ? (v.statementDay ?? null) : null,
    due_day: isCard ? (v.dueDay ?? null) : null,
  }
}

function accountFieldsFrom(formData: FormData) {
  return {
    name: str(formData, "name"),
    institution: str(formData, "institution"),
    wallet: str(formData, "wallet"),
    limit: str(formData, "limit"),
    statementDay: str(formData, "statementDay"),
    dueDay: str(formData, "dueDay"),
  }
}

export async function createAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = accountCreateSchema.safeParse({
    type: str(formData, "type"),
    currency: str(formData, "currency") || "PEN",
    balance: str(formData, "balance"),
    ...accountFieldsFrom(formData),
  })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  const { type, currency, balance } = parsed.data
  const spaceId = await getActiveSpaceId()
  const [active, archived] = await Promise.all([listAccounts(spaceId), listArchivedAccounts(spaceId)])

  const supabase = await createClient()
  const { error } = await supabase.from("accounts").insert({
    space_id: spaceId,
    type,
    currency,
    ...accountColumns(type, currency, parsed.data),
    // La deuda de una tarjeta se guarda como saldo negativo
    opening_balance_cents: type === "credit_card" ? -balance : balance,
    sort_order: active.length + archived.length,
  })
  if (error) return { error: GENERIC_ERROR }

  revalidatePath("/", "layout")
  return { ok: true, message: "Cuenta agregada" }
}

export async function updateAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = accountUpdateSchema.safeParse({ id: str(formData, "id"), ...accountFieldsFrom(formData) })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  const spaceId = await getActiveSpaceId()
  const account = (await listAccounts(spaceId)).find((a) => a.id === parsed.data.id)
  if (!account) return { error: GENERIC_ERROR }

  const ruleErrors = accountRuleErrors({ ...parsed.data, type: account.type })
  if (Object.keys(ruleErrors).length > 0) return { fieldErrors: ruleErrors }

  const supabase = await createClient()
  const { error } = await supabase
    .from("accounts")
    .update(accountColumns(account.type, account.currency, parsed.data))
    .eq("id", account.id)
    .eq("space_id", spaceId)
  if (error) return { error: GENERIC_ERROR }

  revalidatePath("/", "layout")
  return { ok: true, message: "Cambios guardados" }
}

/**
 * Deja el saldo igual al real con un movimiento de ajuste por la diferencia.
 * Así el historial sigue cuadrando (no se toca el saldo inicial).
 */
export async function adjustBalance(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = balanceAdjustSchema.safeParse({ id: str(formData, "id"), balance: str(formData, "balance") })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  const spaceId = await getActiveSpaceId()
  const account = (await listAccounts(spaceId)).find((a) => a.id === parsed.data.id)
  if (!account) return { error: GENERIC_ERROR }

  const target = account.type === "credit_card" ? -parsed.data.balance : parsed.data.balance
  const difference = target - account.balanceCents
  if (difference === 0) return { ok: true, message: "El saldo ya estaba al día" }

  const supabase = await createClient()
  const { error } = await supabase.from("transactions").insert({
    space_id: spaceId,
    type: "adjustment",
    account_id: account.id,
    amount_cents: difference,
    currency: account.currency,
    description: "Ajuste de saldo",
    occurred_on: todayISO(),
    source: "app",
  })
  if (error) return { error: GENERIC_ERROR }

  revalidatePath("/", "layout")
  return { ok: true, message: "Saldo ajustado" }
}

/** Archiva una cuenta. Solo con saldo 0, para que el patrimonio no cambie sin que se note. */
export async function archiveAccount(id: string): Promise<FormState> {
  const spaceId = await getActiveSpaceId()
  const accounts = await listAccounts(spaceId)
  const account = accounts.find((a) => a.id === id)
  if (!account) return { error: GENERIC_ERROR }
  if (account.balanceCents !== 0) {
    return { error: "Deja el saldo en 0 antes de archivarla: transfiere lo que queda o ajusta el saldo." }
  }
  if (accounts.length === 1) return { error: "Necesitas al menos una cuenta activa." }

  return setArchived(spaceId, id, true)
}

export async function restoreAccount(id: string): Promise<FormState> {
  return setArchived(await getActiveSpaceId(), id, false)
}

async function setArchived(spaceId: string, id: string, archived: boolean): Promise<FormState> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("accounts")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("space_id", spaceId)
    .select("id")
  if (error || data.length === 0) return { error: GENERIC_ERROR }

  revalidatePath("/", "layout")
  return { ok: true, message: archived ? "Cuenta archivada" : "Cuenta restaurada" }
}
