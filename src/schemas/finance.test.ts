import { describe, expect, it } from "vitest"

import { accountCreateSchema, accountRuleErrors, transferSchema } from "./finance"

const BANK = "8f0c2a4e-1b3d-4c5e-9f6a-7b8c9d0e1f2a"
const CARD = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"

const base = { amount: "250.50", toAmount: "", accountId: BANK, toAccountId: CARD, occurredOn: "2026-10-08" }

describe("transferSchema", () => {
  it("acepta una transferencia y convierte a céntimos", () => {
    const result = transferSchema.parse(base)
    expect(result.amount).toBe(25050)
    expect(result.toAmount).toBe(0)
  })

  it("lee el monto recibido en cambios de moneda", () => {
    expect(transferSchema.parse({ ...base, toAmount: "66.80" }).toAmount).toBe(6680)
  })

  it("rechaza la misma cuenta como origen y destino", () => {
    const result = transferSchema.safeParse({ ...base, toAccountId: BANK })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(["toAccountId"])
  })

  it("exige un monto mayor a 0", () => {
    expect(transferSchema.safeParse({ ...base, amount: "0" }).success).toBe(false)
    expect(transferSchema.safeParse({ ...base, amount: "" }).success).toBe(false)
  })
})

describe("accountCreateSchema", () => {
  const base = {
    type: "bank",
    currency: "PEN",
    balance: "1,500",
    name: "",
    institution: "BCP",
    wallet: "yape",
    limit: "",
  }

  it("acepta una cuenta bancaria", () => {
    const result = accountCreateSchema.parse(base)
    expect(result.balance).toBe(150000)
    expect(result.limit).toBe(0)
  })

  it("exige la entidad en bancos y ahorros", () => {
    const result = accountCreateSchema.safeParse({ ...base, type: "savings", institution: " " })
    expect(result.error?.issues[0].path).toEqual(["institution"])
  })

  it("exige nombre y línea en tarjetas", () => {
    const result = accountCreateSchema.safeParse({ ...base, type: "credit_card", institution: "" })
    expect(result.error?.issues.map((i) => i.path[0]).sort()).toEqual(["limit", "name"])
  })

  it("acepta una tarjeta en dólares con días de corte y pago", () => {
    const result = accountCreateSchema.parse({
      ...base,
      type: "credit_card",
      currency: "USD",
      name: "Visa USD",
      limit: "2000",
      statementDay: "20",
      dueDay: "15",
    })
    expect(result).toMatchObject({ limit: 200000, statementDay: 20, dueDay: 15 })
  })
})

describe("accountRuleErrors", () => {
  it("el efectivo no necesita nada más", () => {
    expect(accountRuleErrors({ type: "cash", name: "", institution: "", limit: 0 })).toEqual({})
  })
})
