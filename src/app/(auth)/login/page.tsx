import type { Metadata } from "next"
import Link from "next/link"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/forms"
import { safeNextPath } from "@/lib/auth-errors"

export const metadata: Metadata = { title: "Entrar" }

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, confirmado } = await searchParams
  const nextPath = safeNextPath(next, "")

  return (
    <AuthShell
      title="Hola de nuevo"
      description="Entra para ver tus cuentas y movimientos."
      footer={
        <>
          ¿Primera vez?{" "}
          <Link href="/registro" className="font-medium text-foreground underline-offset-4 hover:underline">
            Crea tu cuenta
          </Link>
        </>
      }
    >
      <LoginForm
        next={nextPath || undefined}
        notice={confirmado ? "Tu correo quedó confirmado. Entra con tu contraseña." : undefined}
      />
    </AuthShell>
  )
}
