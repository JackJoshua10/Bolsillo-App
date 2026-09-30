"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { authErrorMessage, safeNextPath } from "@/lib/auth-errors"
import type { FormState } from "@/lib/form-state"
import { createClient } from "@/lib/supabase/server"
import { newPasswordSchema, resetRequestSchema, signInSchema, signUpSchema } from "@/schemas/auth"

/** Origen del request (localhost, preview de Vercel o producción) para los enlaces de los correos. */
async function getOrigin() {
  const h = await headers()
  const origin = h.get("origin")
  if (origin) return origin
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "https"
  return `${proto}://${host}`
}

function invalid(error: z.ZodError, values?: Record<string, string>): FormState {
  return { fieldErrors: z.flattenError(error).fieldErrors, values }
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData))
  const values = { email: String(formData.get("email") ?? "") }
  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: authErrorMessage(error), values }

  redirect(safeNextPath(formData.get("next")))
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData))
  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") }
  if (!parsed.success) return invalid(parsed.error, values)

  const { name, email, password } = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${await getOrigin()}/auth/confirm?next=/`,
    },
  })
  if (error) return { error: authErrorMessage(error), values }

  // Si la confirmación por correo está desactivada, la sesión ya existe
  if (data.session) redirect("/")

  // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados
  return { message: `Te enviamos un correo a ${email}. Abre el enlace para activar tu cuenta.` }
}

export async function signInWithGoogle(_prev: FormState, formData: FormData): Promise<FormState> {
  const next = safeNextPath(formData.get("next"))
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await getOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  })
  if (error || !data.url) return { error: authErrorMessage(error) }

  redirect(data.url)
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetRequestSchema.safeParse(Object.fromEntries(formData))
  const values = { email: String(formData.get("email") ?? "") }
  if (!parsed.success) return invalid(parsed.error, values)

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await getOrigin()}/auth/confirm?next=/nueva-contrasena`,
  })
  if (error?.code === "over_email_send_rate_limit") return { error: authErrorMessage(error), values }

  return { message: "Si hay una cuenta con ese correo, te llegará un enlace para crear una nueva contraseña." }
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return invalid(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { error: authErrorMessage(error) }

  redirect("/")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
