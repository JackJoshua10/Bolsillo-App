import type { AccountType } from "@/components/finance/account-tile"
import type { Currency } from "@/lib/money"

/**
 * Datos de ejemplo para validar el diseño antes de conectar Supabase.
 * Se eliminan en la Fase 1.
 */

export interface DemoAccount {
  id: string
  name: string
  subtitle?: string
  type: AccountType
  currency: Currency
  balanceCents: number
  creditLimitCents?: number
}

export interface DemoTransaction {
  id: string
  date: string // YYYY-MM-DD
  type: "expense" | "income" | "transfer"
  description: string
  category: string
  account: string
  cents: number
  currency: Currency
}

export const demoAccounts: DemoAccount[] = [
  { id: "a1", name: "BCP", subtitle: "Yape", type: "bank", currency: "PEN", balanceCents: 245030 },
  { id: "a2", name: "Efectivo", type: "cash", currency: "PEN", balanceCents: 18000 },
  { id: "a3", name: "Visa BCP", type: "credit_card", currency: "PEN", balanceCents: -86540, creditLimitCents: 500000 },
]

export const demoTransactions: DemoTransaction[] = [
  {
    id: "t1",
    date: "2026-09-25",
    type: "expense",
    description: "Menú del día",
    category: "Comida",
    account: "BCP · Yape",
    cents: 1500,
    currency: "PEN",
  },
  {
    id: "t2",
    date: "2026-09-25",
    type: "expense",
    description: "Taxi a la oficina",
    category: "Transporte",
    account: "Efectivo",
    cents: 1200,
    currency: "PEN",
  },
  {
    id: "t3",
    date: "2026-09-24",
    type: "expense",
    description: "Plaza Vea",
    category: "Supermercado",
    account: "Visa BCP",
    cents: 18790,
    currency: "PEN",
  },
  {
    id: "t4",
    date: "2026-09-24",
    type: "transfer",
    description: "Pago de tarjeta",
    category: "Transferencia",
    account: "BCP → Visa",
    cents: 50000,
    currency: "PEN",
  },
  {
    id: "t5",
    date: "2026-09-23",
    type: "expense",
    description: "Netflix",
    category: "Suscripciones",
    account: "Visa BCP",
    cents: 4490,
    currency: "PEN",
  },
  {
    id: "t6",
    date: "2026-09-23",
    type: "income",
    description: "Freelance landing",
    category: "Freelance",
    account: "BCP · Yape",
    cents: 60000,
    currency: "PEN",
  },
]

/** Patrimonio neto de los últimos 30 días (para el sparkline). */
export const demoNetWorthTrend = [
  1420, 1395, 1410, 1388, 1372, 1450, 1432, 1418, 1405, 1480, 1466, 1452, 1440, 1520, 1508, 1495, 1482, 1470, 1545,
  1530, 1515, 1502, 1490, 1560, 1548, 1535, 1590, 1575, 1560, 1765,
]

export const demoMonth = { spentCents: 184320, budgetCents: 250000, lastMonthDeltaPct: 4.2 }
