import type { Currency } from "@/lib/money"

export type AccountType = "cash" | "wallet" | "bank" | "credit_card" | "savings"
export type Wallet = "yape" | "plin"
export type CategoryKind = "expense" | "income"
export type TransactionType = "expense" | "income" | "transfer" | "adjustment"
export type PaymentMethod = "yape" | "plin" | "debit_card" | "credit_card" | "bank_transfer" | "cash"

export interface Account {
  id: string
  name: string
  type: AccountType
  currency: Currency
  institution: string | null
  wallet: Wallet | null
  creditLimitCents: number | null
  statementDay: number | null
  dueDay: number | null
  balanceCents: number
}

export interface Category {
  id: string
  kind: CategoryKind
  name: string
  icon: string | null
}

export interface TransactionItem {
  id: string
  type: TransactionType
  amountCents: number
  currency: Currency
  description: string | null
  occurredOn: string
  categoryName: string | null
  categoryIcon: string | null
  accountLabel: string
  toAccountLabel: string | null
}

export const WALLET_LABEL: Record<Wallet, string> = { yape: "Yape", plin: "Plin" }

/** "BCP · Yape", "Efectivo", "Visa BCP" */
export function accountLabel(account: { name: string; wallet: Wallet | null }) {
  return account.wallet ? `${account.name} · ${WALLET_LABEL[account.wallet]}` : account.name
}
