"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

const OPTIONS = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
] as const

const noopSubscribe = () => () => {}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  // El tema solo se conoce en el cliente; evita desajustes de hidratación
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className={cn("inline-flex rounded-md border border-line bg-surface p-0.5", className)}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors",
              active && "bg-surface-2 text-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </button>
        )
      })}
    </div>
  )
}
