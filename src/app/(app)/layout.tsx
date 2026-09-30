import { redirect } from "next/navigation"

import { QuickAdd } from "@/components/finance/quick-add"
import { todayISO } from "@/lib/dates"
import { requireUser } from "@/server/auth"
import { getActiveSpaceId, listAccounts, listCategories } from "@/server/finance"

/** Todo lo que está dentro de (app) requiere sesión y al menos una cuenta. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser()
  const spaceId = await getActiveSpaceId()
  const [accounts, categories] = await Promise.all([listAccounts(spaceId), listCategories(spaceId)])
  if (accounts.length === 0) redirect("/bienvenida")

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+6rem)]">
        {children}
      </main>
      <QuickAdd accounts={accounts} categories={categories} today={todayISO()} />
    </>
  )
}
