"use client"

import { Search, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

import { Segmented } from "@/components/forms/segmented"
import { filtersHref, hasActiveFilters, type FilterParams, type TypeParam } from "@/lib/transaction-filters"
import { accountLabel, type Account, type Category } from "@/types/finance"

const TYPE_OPTIONS = [
  { value: "", label: "Todo" },
  { value: "gasto", label: "Gastos" },
  { value: "ingreso", label: "Ingresos" },
  { value: "transferencia", label: "Transf." },
] as const

const selectClass = "h-9 w-full min-w-0 rounded-full border border-line bg-surface px-3 text-sm text-foreground"

interface TransactionFiltersProps {
  params: FilterParams
  accounts: Account[]
  categories: Category[]
}

/** Buscador y filtros de /movimientos. Todo vive en la URL. */
export function TransactionFilters({ params, accounts, categories }: TransactionFiltersProps) {
  const router = useRouter()
  const [query, setQuery] = useState(params.q ?? "")
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  function apply(changes: Partial<FilterParams>) {
    router.replace(filtersHref(params, changes), { scroll: false })
  }

  // Busca mientras escribe, con una pausa corta para no pedir en cada tecla
  function changeQuery(next: string) {
    setQuery(next)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => apply({ q: next.trim() || undefined }), 300)
  }

  const expenseCategories = categories.filter((c) => c.kind === "expense")
  const incomeCategories = categories.filter((c) => c.kind === "income")

  return (
    <div className="flex flex-col gap-3 px-5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
          placeholder="Buscar por descripción"
          aria-label="Buscar por descripción"
          className="h-10 w-full rounded-lg border border-line bg-surface pr-9 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-foreground/30 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => changeQuery("")}
            aria-label="Borrar búsqueda"
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <Segmented<"" | TypeParam>
        name="tipo"
        label="Tipo de movimiento"
        options={TYPE_OPTIONS}
        value={params.tipo ?? ""}
        // Cambiar el tipo limpia la categoría (puede no corresponder)
        onChange={(tipo) => apply({ tipo: tipo || undefined, categoria: undefined })}
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label="Cuenta"
          value={params.cuenta ?? ""}
          onChange={(e) => apply({ cuenta: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">Todas las cuentas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {accountLabel(a)}
            </option>
          ))}
        </select>

        <select
          aria-label="Categoría"
          value={params.categoria ?? ""}
          // Una categoría ya define el tipo (gasto o ingreso)
          onChange={(e) => apply({ categoria: e.target.value || undefined, tipo: undefined })}
          className={selectClass}
        >
          <option value="">Todas las categorías</option>
          <optgroup label="Gastos">
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Ingresos">
            {incomeCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {hasActiveFilters(params) && (
        <Link
          href={filtersHref({ periodo: params.periodo })}
          replace
          scroll={false}
          onClick={() => setQuery("")}
          className="self-start text-xs text-brand-text underline-offset-4 hover:underline"
        >
          Quitar filtros
        </Link>
      )}
    </div>
  )
}
