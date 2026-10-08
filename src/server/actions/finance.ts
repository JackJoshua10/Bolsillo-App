"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { fieldErrorsFrom, type FormState } from "@/lib/form-state"
import { createClient } from "@/lib/supabase/server"
import { impliedUsdToPen } from "@/lib/money"
import { onboardingSchema, transactionSchema, transferSchema } from "@/schemas/finance"
import type { Account, PaymentMethod } from "@/types/finance"
import { getActiveSpaceId, listAccounts } from "../finance"

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

export async function createTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = transactionSchema.safeParse({
    type: str(formData, "type"),
    amount: str(formData, "amount"),
    accountId: str(formData, "accountId"),
    categoryId: str(formData, "categoryId"),
    description: str(formData, "description") || undefined,
    occurredOn: str(formData, "occurredOn"),
  })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  const { type, amount, accountId, categoryId, description, occurredOn } = parsed.data
  const spaceId = await getActiveSpaceId()
  const account = (await listAccounts(spaceId)).find((a) => a.id === accountId)
  if (!account) return { fieldErrors: { accountId: ["Elige una cuenta"] } }

  const supabase = await createClient()
  const { error } = await supabase.from("transactions").insert({
    space_id: spaceId,
    type,
    account_id: account.id,
    amount_cents: amount,
    currency: account.currency, // la base de datos igual la toma de la cuenta
    category_id: categoryId,
    payment_method: defaultPaymentMethod(account),
    description: description ?? null,
    occurred_on: occurredOn,
    source: "app",
  })
  if (error) return { error: GENERIC_ERROR }

  revalidatePath("/", "layout")
  return { ok: true, message: type === "expense" ? "Gasto registrado" : "Ingreso registrado" }
}

/** Mensaje según el caso: pagar tarjeta, cambiar dólares o mover dinero. */
function transferMessage(from: Account, to: Account) {
  if (to.type === "credit_card") return "Pago de tarjeta registrado"
  if (from.currency !== to.currency) return "Cambio registrado"
  return "Transferencia registrada"
}

export async function createTransfer(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = transferSchema.safeParse({
    amount: str(formData, "amount"),
    toAmount: str(formData, "toAmount"),
    accountId: str(formData, "accountId"),
    toAccountId: str(formData, "toAccountId"),
    description: str(formData, "description") || undefined,
    occurredOn: str(formData, "occurredOn"),
  })
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) }

  const { amount, toAmount, accountId, toAccountId, description, occurredOn } = parsed.data
  const spaceId = await getActiveSpaceId()
  const accounts = await listAccounts(spaceId)
  const from = accounts.find((a) => a.id === accountId)
  const to = accounts.find((a) => a.id === toAccountId)
  if (!from) return { fieldErrors: { accountId: ["Elige de dónde sale"] } }
  if (!to) return { fieldErrors: { toAccountId: ["Elige a dónde va"] } }

  const crossCurrency = from.currency !== to.currency
  if (crossCurrency && toAmount <= 0) return { fieldErrors: { toAmount: ["¿Cuánto recibiste?"] } }

  const supabase = await createClient()
  const { error } = await supabase.from("transactions").insert({
    space_id: spaceId,
    type: "transfer",
    account_id: from.id,
    amount_cents: amount,
    currency: from.currency, // la base de datos igual la toma de la cuenta
    to_account_id: to.id,
    to_amount_cents: crossCurrency ? toAmount : amount,
    exchange_rate: crossCurrency ? impliedUsdToPen(amount, from.currency, toAmount, to.currency) : null,
    payment_method: from.type === "bank" ? "bank_transfer" : null,
    description: description ?? null,
    occurred_on: occurredOn,
    source: "app",
  })
  if (error) return { error: GENERIC_ERROR }

  revalidatePath("/", "layout")
  return { ok: true, message: transferMessage(from, to) }
}
