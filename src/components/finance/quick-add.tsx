"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { BottomNav } from "@/components/bottom-nav"
import { Field, FormAlert, SubmitButton } from "@/components/forms/fields"
import { Segmented } from "@/components/forms/segmented"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { FormState } from "@/lib/form-state"
import { CURRENCY_SYMBOL } from "@/lib/money"
import { cn } from "@/lib/utils"
import { createTransaction } from "@/server/actions/finance"
import { accountLabel, type Account, type Category, type CategoryKind } from "@/types/finance"
import { CategoryIcon } from "./category-icon"

const TYPES = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
] as const

const LAST_ACCOUNT_KEY = "bolsillo:last-account"

function readLastAccount() {
  try {
    return localStorage.getItem(LAST_ACCOUNT_KEY)
  } catch {
    return null
  }
}

interface QuickAddProps {
  accounts: Account[]
  categories: Category[]
  today: string
}

/** Barra inferior + hoja para registrar un gasto o ingreso en segundos. */
export function QuickAdd({ accounts, categories, today }: QuickAddProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<CategoryKind>("expense")
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "")
  const [categoryId, setCategoryId] = useState("")
  const [state, setState] = useState<FormState>()
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const visibleCategories = categories.filter((c) => c.kind === type)
  const account = accounts.find((a) => a.id === accountId) ?? accounts[0]
  const errors = state?.fieldErrors ?? {}

  function openSheet() {
    const last = readLastAccount()
    if (last && accounts.some((a) => a.id === last)) setAccountId(last)
    setState(undefined)
    setOpen(true)
  }

  function changeType(next: CategoryKind) {
    setType(next)
    setCategoryId("")
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await createTransaction(undefined, formData)
      setState(result)
      if (!result?.ok) return

      try {
        localStorage.setItem(LAST_ACCOUNT_KEY, accountId)
      } catch {
        // Sin almacenamiento (modo privado): no pasa nada
      }
      toast.success(result.message)
      formRef.current?.reset()
      setCategoryId("")
      setOpen(false)
    })
  }

  return (
    <>
      <BottomNav onAdd={openSheet} />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[92dvh] max-w-md gap-0 overflow-y-auto rounded-t-2xl border-line bg-background pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-none"
        >
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle>Nuevo movimiento</SheetTitle>
            <SheetDescription className="sr-only">Registra un gasto o un ingreso</SheetDescription>
          </SheetHeader>

          <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-5 px-5">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="accountId" value={account?.id ?? ""} />
            <input type="hidden" name="categoryId" value={categoryId} />

            <Segmented name="_type" label="Tipo" options={TYPES} value={type} onChange={changeType} />

            {/* Monto */}
            <div className="flex flex-col items-center gap-1">
              <label htmlFor="quick-amount" className="sr-only">
                Monto
              </label>
              <div className="flex items-baseline gap-2">
                <span className="num text-xl text-muted-foreground">{CURRENCY_SYMBOL[account?.currency ?? "PEN"]}</span>
                <input
                  id="quick-amount"
                  name="amount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  autoFocus
                  aria-invalid={Boolean(errors.amount) || undefined}
                  className={cn(
                    "w-44 bg-transparent text-center num text-5xl leading-none outline-none placeholder:text-muted-foreground/40",
                    type === "income" && "text-brand-text",
                  )}
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount[0]}</p>}
            </div>

            {/* Categoría */}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-xs text-muted-foreground">Categoría</legend>
              <div className="grid grid-cols-4 gap-px border border-line bg-line">
                {visibleCategories.map((category) => {
                  const active = category.id === categoryId
                  return (
                    <button
                      key={category.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategoryId(category.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 bg-surface px-1 py-3 text-[11px] text-muted-foreground transition-colors",
                        active && "bg-brand text-brand-foreground",
                      )}
                    >
                      <CategoryIcon icon={category.icon} className="size-5" />
                      <span className="w-full truncate text-center">{category.name}</span>
                    </button>
                  )
                })}
              </div>
              {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId[0]}</p>}
            </fieldset>

            {/* Cuenta */}
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-xs text-muted-foreground">
                {type === "expense" ? "Pagado con" : "Recibido en"}
              </legend>
              <div className="flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={a.id === account?.id}
                    onClick={() => setAccountId(a.id)}
                    className={cn(
                      "h-9 rounded-full border border-line bg-surface px-3.5 text-sm text-muted-foreground",
                      a.id === account?.id && "border-foreground/30 bg-surface-2 text-foreground",
                    )}
                  >
                    {accountLabel(a)}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Field
                label="Descripción (opcional)"
                name="description"
                placeholder={type === "expense" ? "Menú, taxi, Plaza Vea…" : "Sueldo de setiembre…"}
                maxLength={140}
                errors={errors.description}
              />
              <Field
                label="Fecha"
                name="occurredOn"
                type="date"
                defaultValue={today}
                max={today}
                className="w-36"
                errors={errors.occurredOn}
              />
            </div>

            <FormAlert error={state?.error} />
            <SubmitButton pending={pending}>{type === "expense" ? "Guardar gasto" : "Guardar ingreso"}</SubmitButton>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
