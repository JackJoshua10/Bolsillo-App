import { cn } from "@/lib/utils"

/** Marca de Bolsillo: la "b" citrina sobre grafito + nombre. Mismo diseño que el ícono de la app. */
export function Brand({ className, showName = true }: { className?: string; showName?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="flex size-9 items-center justify-center rounded-[10px] bg-[#0e0f0e] text-xl leading-none font-bold text-[#d4f24a] dark:ring-1 dark:ring-line"
      >
        <span className="-mt-0.5">b</span>
      </span>
      {showName && <span className="text-lg font-semibold tracking-tight">Bolsillo</span>}
    </span>
  )
}
