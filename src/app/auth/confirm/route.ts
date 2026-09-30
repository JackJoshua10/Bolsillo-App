import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { safeNextPath } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/server"

/**
 * Enlaces de los correos (confirmar cuenta, recuperar contraseña).
 * Las plantillas de correo de Supabase apuntan aquí con `token_hash` y `type`
 * (ver docs/06-configurar-supabase.md).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = safeNextPath(searchParams.get("next"))

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, request.url))

    const failed = new URL("/auth/error", request.url)
    if (error.code) failed.searchParams.set("code", error.code)
    return NextResponse.redirect(failed)
  }

  return NextResponse.redirect(new URL("/auth/error", request.url))
}
