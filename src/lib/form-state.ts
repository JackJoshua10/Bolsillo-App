import type { z } from "zod"

/**
 * Errores de Zod → { "card_limit": ["..."] }. La ruta se une con "_" para que
 * coincida con el `name` de los campos del formulario. Los errores sin ruta van a "_form".
 */
export function fieldErrorsFrom(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join("_") : "_form"
    ;(fieldErrors[key] ??= []).push(issue.message)
  }
  return fieldErrors
}

/** Estado que devuelven las Server Actions de formularios (para useActionState). */
export type FormState =
  | {
      /** Error general, arriba del formulario */
      error?: string
      /** Mensaje de éxito (por ejemplo, "revisa tu correo") */
      message?: string
      /** true cuando la acción terminó bien (para cerrar un sheet, limpiar el formulario, etc.) */
      ok?: boolean
      /** Errores por campo */
      fieldErrors?: Partial<Record<string, string[]>>
      /** Valores para volver a llenar el formulario tras un error (nunca contraseñas) */
      values?: Record<string, string>
    }
  | undefined
