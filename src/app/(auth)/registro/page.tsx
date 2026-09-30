import type { Metadata } from "next"
import Link from "next/link"

import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpForm } from "@/components/auth/forms"

export const metadata: Metadata = { title: "Crear cuenta" }

export default function SignUpPage() {
  return (
    <AuthShell
      title="Crea tu cuenta"
      description="Tus finanzas, en el bolsillo. Solo tú ves tus datos."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Entra
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  )
}
