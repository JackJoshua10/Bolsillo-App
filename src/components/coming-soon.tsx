import type { LucideIcon } from "lucide-react"

/** Pantalla provisional para secciones que aún no existen. */
export function ComingSoon({ title, description, Icon }: { title: string; description: string; Icon: LucideIcon }) {
  return (
    <>
      <header className="px-5 pt-5">
        <h1 className="text-lg font-semibold">{title}</h1>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-10 text-center">
        <Icon className="size-8 text-muted-foreground" strokeWidth={1.25} />
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </>
  )
}
