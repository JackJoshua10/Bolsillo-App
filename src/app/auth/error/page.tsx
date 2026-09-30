import type { Metadata } from "next"
import Link from "next/link"

import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { authErrorMessage } from "@/lib/auth-errors"

export const metadata: Metadata = { title: "No pudimos continuar" }

export default async function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  const { code } = await searchParams
  const message =
    code === "access_denied"
      ? "Cancelaste el inicio de sesión con Google."
      : authErrorMessage({ code: typeof code === "string" ? code : undefined })

  return (
    <AuthShell title="No pudimos continuar" description={message}>
      <Button asChild size="lg" className="h-11 w-full text-base">
        <Link href="/login">Volver a entrar</Link>
      </Button>
    </AuthShell>
  )
}
