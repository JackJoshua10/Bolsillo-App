import { NextResponse, type NextRequest } from "next/server"

import { safeNextPath } from "@/lib/auth-errors"
import { updateSession, withSessionCookies } from "@/lib/supabase/proxy"

/** Páginas para quien NO tiene sesión (con sesión, se va al inicio). */
const GUEST_ONLY = new Set(["/login", "/registro", "/recuperar"])
/** Rutas abiertas con o sin sesión (confirmación de correo, OAuth). */
const OPEN_PREFIXES = ["/auth/"]

/**
 * Refresca la sesión en cada request y hace la verificación "optimista" de rutas.
 * La verificación real de permisos está en src/server/auth.ts y en la RLS de la base de datos.
 */
export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request)
  const { pathname, search } = request.nextUrl

  if (OPEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return response

  if (!userId && !GUEST_ONLY.has(pathname)) {
    const login = new URL("/login", request.url)
    if (pathname !== "/") login.searchParams.set("next", pathname + search)
    return withSessionCookies(response, NextResponse.redirect(login))
  }

  if (userId && GUEST_ONLY.has(pathname)) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"))
    return withSessionCookies(response, NextResponse.redirect(new URL(next, request.url)))
  }

  return response
}

export const config = {
  // Todo menos archivos estáticos, íconos, manifest y la API (que usa tokens propios)
  matcher: [
    "/((?!_next/static|_next/image|api/|icons/|icon|apple-icon|manifest.webmanifest|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
}
