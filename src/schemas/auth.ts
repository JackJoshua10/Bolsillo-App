import { z } from "zod"

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Ingresa un correo válido." }))

// bcrypt (Supabase) solo usa los primeros 72 bytes
const newPassword = z
  .string()
  .min(8, { error: "Usa al menos 8 caracteres." })
  .max(72, { error: "Máximo 72 caracteres." })

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: "Ingresa tu contraseña." }),
})

export const signUpSchema = z.object({
  name: z.string().trim().min(1, { error: "¿Cómo te llamas?" }).max(60, { error: "Máximo 60 caracteres." }),
  email,
  password: newPassword,
})

export const resetRequestSchema = z.object({ email })

export const newPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { error: "Las contraseñas no coinciden.", path: ["confirm"] })
