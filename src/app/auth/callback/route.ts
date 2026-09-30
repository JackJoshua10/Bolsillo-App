import { NextResponse, type NextRequest } from "next/server"

import { safeNextPath } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/server"

/** Regreso desde Google (OAuth con PKCE): canjea el código por una sesión. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, request.url))

    const failed = new URL("/auth/error", request.url)
    if (error.code) failed.searchParams.set("code", error.code)
    return NextResponse.redirect(failed)
  }

  // El usuario canceló en Google u ocurrió un error del proveedor
  const failed = new URL("/auth/error", request.url)
  const providerError = searchParams.get("error_code") ?? searchParams.get("error")
  if (providerError) failed.searchParams.set("code", providerError)
  return NextResponse.redirect(failed)
}
