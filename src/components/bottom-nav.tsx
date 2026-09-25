"use client"

import { ChartPie, House, List, Plus, User, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  Icon: LucideIcon
}

const LEFT: NavItem[] = [
  { href: "/", label: "Inicio", Icon: House },
  { href: "/movimientos", label: "Movimientos", Icon: List },
]
const RIGHT: NavItem[] = [
  { href: "/analisis", label: "Análisis", Icon: ChartPie },
  { href: "/perfil", label: "Perfil", Icon: User },
]

/** Barra inferior delgada: subrayado citrino en el activo y "+" central relleno. */
export function BottomNav({ onAdd }: { onAdd?: () => void }) {
  const pathname = usePathname()

  const renderItem = ({ href, label, Icon }: NavItem) => {
    const active = pathname === href
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex flex-1 flex-col items-center gap-1 pt-2.5 pb-2 text-[10px] text-muted-foreground",
          active && "text-foreground",
        )}
      >
        <span className={cn("absolute top-0 h-0.5 w-6 bg-brand-text opacity-0", active && "opacity-100")} />
        <Icon className="size-5" strokeWidth={1.75} />
        {label}
      </Link>
    )
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch">
        {LEFT.map(renderItem)}
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={onAdd ?? (() => toast("Agregar movimiento llega en la Fase 1"))}
            aria-label="Agregar movimiento"
            className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-brand text-brand-foreground transition-transform active:scale-95"
          >
            <Plus className="size-6" strokeWidth={2.25} />
          </button>
        </div>
        {RIGHT.map(renderItem)}
      </div>
    </nav>
  )
}
