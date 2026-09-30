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

export const transactionSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: positiveAmount,
  accountId: z.uuid({ error: "Elige una cuenta" }),
  categoryId: z.uuid({ error: "Elige una categoría" }),
  description: z.string().trim().max(140, { error: "Máximo 140 caracteres" }).optional(),
  occurredOn: z.iso.date({ error: "Fecha inválida" }),
})
