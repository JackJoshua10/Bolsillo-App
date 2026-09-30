import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getSupabaseEnv } from "./env"

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Crear uno por request (no reutilizar entre requests).
 */
export async function createClient() {
  const cookieStore = await cookies()
  const { url, key } = getSupabaseEnv()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
        } catch {
          // Llamado desde un Server Component (no puede escribir cookies).
          // No pasa nada: proxy.ts ya refrescó la sesión en este request.
        }
      },
    },
  })
}
