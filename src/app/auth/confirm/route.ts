import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { safeNextPath } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/server"

/**
 * Enlaces de los correos (confirmar cuenta, recuperar contraseña). Acepta dos formatos:
 * - `token_hash` + `type`: plantillas propias (requieren SMTP propio). Funciona en cualquier navegador.
 * - `code`: plantillas por defecto de Supabase (flujo PKCE). Hay que abrir el enlace
 *   en el mismo navegador donde se pidió.
 * Ver docs/06-configurar-supabase.md
 */
const RECOVERY_PATH = "/nueva-contrasena"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"))

  const supabase = await createClient()
  let errorCode: string | undefined

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, request.url))
    errorCode = error.code
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, request.url))

    // Supabase ya confirmó el correo antes de redirigir aquí; solo falló el inicio de sesión
    // automático (el enlace se abrió en otro navegador). En registro basta con entrar.
    if (error.code === "pkce_code_verifier_not_found" && next !== RECOVERY_PATH) {
      return NextResponse.redirect(new URL("/login?confirmado=1", request.url))
    }
    errorCode = error.code
  } else {
    // Supabase redirige con error_code cuando el enlace venció o ya se usó
    errorCode = searchParams.get("error_code") ?? undefined
  }

  const failed = new URL("/auth/error", request.url)
  if (errorCode) failed.searchParams.set("code", errorCode)
  return NextResponse.redirect(failed)
}
