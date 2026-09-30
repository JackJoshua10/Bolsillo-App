import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseEnv } from "./env"

/**
 * Refresca la sesión de Supabase (si el token venció) y devuelve la respuesta
 * con las cookies actualizadas, más el id del usuario si hay sesión.
 */
export async function updateSession(request: NextRequest) {
  const { url, key } = getSupabaseEnv()
  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
        // Evita que un CDN guarde en caché una respuesta con cookies de sesión
        for (const [header, value] of Object.entries(headers ?? {})) response.headers.set(header, value)
      },
    },
  })

  // getClaims valida el JWT (y lo refresca si hace falta). No usar getSession en el servidor.
  const { data } = await supabase.auth.getClaims()

  return { response, userId: data?.claims?.sub ?? null }
}

/** Copia las cookies de sesión a otra respuesta (por ejemplo, una redirección). */
export function withSessionCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) to.cookies.set(cookie)
  return to
}
