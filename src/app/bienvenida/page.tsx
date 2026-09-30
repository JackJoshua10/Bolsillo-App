import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { Brand } from "@/components/brand"
import { OnboardingForm } from "@/components/finance/onboarding-form"
import { getProfile } from "@/server/auth"
import { getActiveSpaceId, listAccounts } from "@/server/finance"

export const metadata: Metadata = { title: "Bienvenida" }

export default async function WelcomePage() {
  const profile = await getProfile()
  const accounts = await listAccounts(await getActiveSpaceId())
  if (accounts.length > 0) redirect("/")

  const firstName = profile.display_name?.split(" ")[0]

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <Brand showName={false} />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">
        {firstName ? `¡Hola, ${firstName}!` : "¡Hola!"} ¿Dónde está tu dinero?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Elige lo que usas y pon el saldo que tienes hoy. No tiene que ser exacto; luego puedes ajustarlo.
      </p>
      <div className="mt-8">
        <OnboardingForm />
      </div>
    </main>
  )
}
