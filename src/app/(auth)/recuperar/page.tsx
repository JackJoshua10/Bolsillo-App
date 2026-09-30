import type { Metadata } from "next"
import Link from "next/link"

import { AuthShell } from "@/components/auth/auth-shell"
import { ResetRequestForm } from "@/components/auth/forms"

export const metadata: Metadata = { title: "Recuperar contraseña" }

export default function ResetRequestPage() {
  return (
    <AuthShell
      title="Recupera tu contraseña"
      description="Te enviaremos un enlace para crear una nueva."
      footer={
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Volver a entrar
        </Link>
      }
    >
      <ResetRequestForm />
    </AuthShell>
  )
}
