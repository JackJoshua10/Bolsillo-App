import { describe, expect, it } from "vitest"

import { transferSchema } from "./finance"

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
