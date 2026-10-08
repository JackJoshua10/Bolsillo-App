import { ChevronLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AccountsManager } from "@/components/finance/accounts-manager"
import { todayISO } from "@/lib/dates"
import { getActiveSpaceId, listAccounts, listArchivedAccounts } from "@/server/finance"

export const metadata: Metadata = { title: "Cuentas" }

export default async function AccountsPage() {
  const spaceId = await getActiveSpaceId()
  const [accounts, archived] = await Promise.all([listAccounts(spaceId), listArchivedAccounts(spaceId)])

  return (
    <>
      <header className="flex items-center gap-1 px-2 pt-4">
        <Link href="/" aria-label="Volver a Inicio" className="flex size-10 items-center justify-center">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold">Cuentas</h1>
      </header>
      <p className="px-5 text-xs text-muted-foreground">Toca una cuenta para editarla o ajustar su saldo.</p>

      <AccountsManager accounts={accounts} archived={archived} today={todayISO()} />
    </>
  )
}
