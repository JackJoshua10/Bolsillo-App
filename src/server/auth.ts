import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

/** Usuario de la sesión actual (validado con el JWT), o null. Se memoiza por request. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) return null
  return { id: claims.sub, email: claims.email ?? null }
})

/** Igual que getCurrentUser, pero redirige al login si no hay sesión. */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export const getProfile = cache(async () => {
  const user = await requireUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, base_currency, theme, month_start_day, default_space_id")
    .eq("id", user.id)
    .single()

  if (error) throw error
  return { ...data, email: user.email }
})
