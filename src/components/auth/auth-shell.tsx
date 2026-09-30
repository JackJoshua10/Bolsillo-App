import { Brand } from "@/components/brand"

interface AuthShellProps {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}

/** Marco común de las pantallas de acceso: marca, título, contenido y pie. */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <Brand />
      <h1 className="mt-10 text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-8">{children}</div>
      {footer && <div className="mt-auto pt-10 text-center text-sm text-muted-foreground">{footer}</div>}
    </main>
  )
}
