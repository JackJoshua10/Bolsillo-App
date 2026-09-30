/** Traduce errores de Supabase Auth a mensajes claros en español. */

const MESSAGES: Record<string, string> = {
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed: "Primero confirma tu correo. Revisa tu bandeja de entrada (y la de spam).",
  user_already_exists: "Ya existe una cuenta con ese correo. Inicia sesión.",
  email_exists: "Ya existe una cuenta con ese correo. Inicia sesión.",
  weak_password: "La contraseña es muy débil. Usa al menos 8 caracteres combinando letras y números.",
  same_password: "La nueva contraseña debe ser distinta a la anterior.",
  email_address_invalid: "Ese correo no es válido.",
  over_email_send_rate_limit: "Enviamos demasiados correos. Espera unos minutos e inténtalo de nuevo.",
  over_request_rate_limit: "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
  otp_expired: "El enlace venció o ya se usó. Pide uno nuevo.",
  flow_state_expired: "El enlace venció. Vuelve a intentarlo.",
  flow_state_not_found: "El enlace ya no es válido. Vuelve a intentarlo.",
  bad_code_verifier: "Abre el enlace en el mismo navegador donde lo pediste.",
  provider_disabled: "Ese método de inicio de sesión aún no está habilitado.",
  oauth_provider_not_supported: "Ese método de inicio de sesión aún no está habilitado.",
  email_provider_disabled: "El registro con correo está deshabilitado.",
  signup_disabled: "El registro de nuevas cuentas está deshabilitado.",
  user_banned: "Esta cuenta está suspendida.",
  session_not_found: "Tu sesión terminó. Inicia sesión de nuevo.",
}

export const GENERIC_AUTH_ERROR = "Algo salió mal. Inténtalo de nuevo en un momento."

export function authErrorMessage(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return GENERIC_AUTH_ERROR
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]
  // Supabase responde así cuando el proveedor OAuth no está activado en el proyecto
  if (error.message?.toLowerCase().includes("provider is not enabled")) return MESSAGES.provider_disabled
  return GENERIC_AUTH_ERROR
}

/** Solo permite redirecciones internas ("/algo"), nunca a otros dominios. */
export function safeNextPath(value: unknown, fallback = "/") {
  if (typeof value !== "string") return fallback
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback
  return value
}
