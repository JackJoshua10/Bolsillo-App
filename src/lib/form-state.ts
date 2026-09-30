/** Estado que devuelven las Server Actions de formularios (para useActionState). */
export type FormState =
  | {
      /** Error general, arriba del formulario */
      error?: string
      /** Mensaje de éxito (por ejemplo, "revisa tu correo") */
      message?: string
      /** Errores por campo */
      fieldErrors?: Partial<Record<string, string[]>>
      /** Valores para volver a llenar el formulario tras un error (nunca contraseñas) */
      values?: Record<string, string>
    }
  | undefined
