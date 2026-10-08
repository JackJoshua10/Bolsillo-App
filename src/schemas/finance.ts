import { z } from "zod"

import { parseAmountToCents } from "@/lib/money"

/** Monto escrito por el usuario → céntimos. Vacío = 0. */
const amount = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "") return 0
    const cents = parseAmountToCents(value)
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Escribe un monto válido, por ejemplo 120.50" })
      return z.NEVER
    }
    return cents
  })

const positiveAmount = amount.refine((cents) => cents > 0, { error: "Debe ser mayor a 0" })

const optionalDay = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  z.coerce.number().int().min(1, { error: "Entre 1 y 31" }).max(31, { error: "Entre 1 y 31" }).optional(),
)

export const onboardingSchema = z
  .object({
    cash: z.object({ balance: amount }).optional(),
    bank: z
      .object({
        institution: z.string().trim().min(1, { error: "¿Qué banco?" }).max(40),
        wallet: z.enum(["", "yape", "plin"]),
        balance: amount,
      })
      .optional(),
    card: z
      .object({
        name: z.string().trim().min(1, { error: "Ponle un nombre, por ejemplo Visa BCP" }).max(40),
        currency: z.enum(["PEN", "USD"]),
        limit: positiveAmount,
        debt: amount,
        statementDay: optionalDay,
        dueDay: optionalDay,
      })
      .optional(),
  })
  .refine((v) => v.cash || v.bank || v.card, { error: "Elige al menos una cuenta para empezar." })

const description = z.string().trim().max(140, { error: "Máximo 140 caracteres" }).optional()
const occurredOn = z.iso.date({ error: "Fecha inválida" })

export const transactionSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: positiveAmount,
  accountId: z.uuid({ error: "Elige una cuenta" }),
  categoryId: z.uuid({ error: "Elige una categoría" }),
  description,
  occurredOn,
})

/**
 * Transferencia entre cuentas propias: pagar la tarjeta, sacar efectivo, cambiar dólares.
 * `toAmount` (lo recibido) solo se usa si las monedas son distintas; eso se valida
 * en el servidor, que es quien conoce la moneda de cada cuenta. Vacío = 0.
 */
export const transferSchema = z
  .object({
    amount: positiveAmount,
    toAmount: amount,
    accountId: z.uuid({ error: "Elige de dónde sale" }),
    toAccountId: z.uuid({ error: "Elige a dónde va" }),
    description,
    occurredOn,
  })
  .refine((v) => v.accountId !== v.toAccountId, {
    error: "Elige una cuenta distinta",
    path: ["toAccountId"],
  })

/** Datos editables de una cuenta (el tipo y la moneda no cambian después de crearla). */
const accountFields = {
  name: z.string().trim().max(40, { error: "Máximo 40 caracteres" }),
  institution: z.string().trim().max(40, { error: "Máximo 40 caracteres" }),
  wallet: z.enum(["", "yape", "plin"]),
  limit: amount,
  statementDay: optionalDay,
  dueDay: optionalDay,
}

export const ACCOUNT_FORM_TYPES = ["cash", "bank", "credit_card", "savings"] as const

interface AccountRuleInput {
  type: (typeof ACCOUNT_FORM_TYPES)[number] | "wallet"
  name: string
  institution: string
  limit: number
}

/**
 * Reglas por tipo: la tarjeta necesita nombre y línea; el banco y los ahorros, la entidad.
 * Se usa al crear (el tipo viene del formulario) y al editar (el tipo viene de la base de datos).
 */
export function accountRuleErrors(v: AccountRuleInput) {
  const errors: Record<string, string[]> = {}
  if (v.type === "credit_card" && !v.name) errors.name = ["Ponle un nombre, por ejemplo Visa BCP"]
  if (v.type === "credit_card" && v.limit <= 0) errors.limit = ["Debe ser mayor a 0"]
  if ((v.type === "bank" || v.type === "savings") && !v.institution) errors.institution = ["¿De qué banco o caja?"]
  return errors
}

export const accountCreateSchema = z
  .object({
    type: z.enum(ACCOUNT_FORM_TYPES, { error: "Elige un tipo de cuenta" }),
    currency: z.enum(["PEN", "USD"]),
    /** Saldo inicial; en tarjetas, la deuda actual */
    balance: amount,
    ...accountFields,
  })
  .superRefine((v, ctx) => {
    for (const [field, [message]] of Object.entries(accountRuleErrors(v))) {
      ctx.addIssue({ code: "custom", message, path: [field] })
    }
  })

export const accountUpdateSchema = z.object({ id: z.uuid(), ...accountFields })

export const balanceAdjustSchema = z.object({
  id: z.uuid(),
  /** Saldo real; en tarjetas, la deuda real */
  balance: amount,
})
