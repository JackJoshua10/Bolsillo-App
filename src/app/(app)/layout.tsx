import { BottomNav } from "@/components/bottom-nav"
import { requireUser } from "@/server/auth"

/** Todo lo que está dentro de (app) requiere sesión. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser()

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+6rem)]">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
