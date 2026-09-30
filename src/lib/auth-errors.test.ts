import { describe, expect, it } from "vitest"

import { authErrorMessage, GENERIC_AUTH_ERROR, safeNextPath } from "./auth-errors"

describe("authErrorMessage", () => {
  it("traduce códigos conocidos", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe("Correo o contraseña incorrectos.")
  })

  it("detecta proveedor OAuth no habilitado por mensaje", () => {
    expect(authErrorMessage({ message: "Unsupported provider: provider is not enabled" })).toMatch(/aún no está/)
  })

  it("usa un mensaje genérico para lo desconocido", () => {
    expect(authErrorMessage({ code: "algo_raro" })).toBe(GENERIC_AUTH_ERROR)
    expect(authErrorMessage(null)).toBe(GENERIC_AUTH_ERROR)
  })
})

describe("safeNextPath", () => {
  it.each([
    ["/", "/"],
    ["/movimientos?x=1", "/movimientos?x=1"],
    ["//evil.com", "/"],
    ["/\\evil.com", "/"],
    ["https://evil.com", "/"],
    ["movimientos", "/"],
    [null, "/"],
    [undefined, "/"],
  ])("%j → %j", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected)
  })
})
