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
