import { LogOut } from "lucide-react"
import type { Metadata } from "next"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { signOut } from "@/server/actions/auth"
import { getProfile } from "@/server/auth"

export const metadata: Metadata = { title: "Perfil" }

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <>
      <header className="px-5 pt-5">
        <h1 className="text-lg font-semibold">Perfil</h1>
      </header>

      <section className="mt-6 border-y border-line bg-surface px-5 py-4">
        <p className="font-medium">{profile.display_name ?? "Sin nombre"}</p>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </section>

      <section className="mt-8">
        <h2 className="px-5 text-xs tracking-wide text-muted-foreground uppercase">Preferencias</h2>
        <div className="mt-3 flex items-center justify-between border-y border-line bg-surface px-5 py-3">
          <span className="text-sm">Tema</span>
          <ThemeToggle />
        </div>
      </section>

      <form action={signOut} className="mt-8 px-5">
        <Button type="submit" variant="outline" size="lg" className="h-11 w-full bg-surface text-base">
          <LogOut />
          Cerrar sesión
        </Button>
      </form>
    </>
  )
}
