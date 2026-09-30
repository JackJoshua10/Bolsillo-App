import type { Metadata } from "next"

import { AuthShell } from "@/components/auth/auth-shell"
import { NewPasswordForm } from "@/components/auth/forms"
import { requireUser } from "@/server/auth"

export const metadata: Metadata = { title: "Nueva contraseña" }

// Se llega desde el enlace del correo de recuperación, que ya inicia la sesión
export default async function NewPasswordPage() {
  await requireUser()

  return (
    <AuthShell title="Nueva contraseña" description="Elige una contraseña de al menos 8 caracteres.">
      <NewPasswordForm />
    </AuthShell>
  )
}
