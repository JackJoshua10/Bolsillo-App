"use client"

import { ArrowDown } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { BottomNav } from "@/components/bottom-nav"
import { Field, FormAlert, SubmitButton } from "@/components/forms/fields"
import { Segmented } from "@/components/forms/segmented"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { FormState } from "@/lib/form-state"
import { CURRENCY_SYMBOL, formatMoney, impliedUsdToPen, parseAmountToCents } from "@/lib/money"
import { cn } from "@/lib/utils"
import { createTransaction, createTransfer } from "@/server/actions/finance"
import { accountLabel, type Account, type Category } from "@/types/finance"
import { CategoryIcon } from "./category-icon"

type QuickAddType = "expense" | "income" | "transfer"

const TYPES = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ingreso" },
  { value: "transfer", label: "Transferencia" },
] as const

const LAST_ACCOUNT_KEY = "bolsillo:last-account"

const rateFormat = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 3, maximumFractionDigits: 4 })

function readLastAccount() {
  try {
    return localStorage.getItem(LAST_ACCOUNT_KEY)
  } catch {
    return null
  }
}

function submitLabel(type: QuickAddType, from?: Account, to?: Account) {
  if (type === "expense") return "Guardar gasto"
  if (type === "income") return "Guardar ingreso"
  if (to?.type === "credit_card") return "Pagar tarjeta"
  if (from && to && from.currency !== to.currency) return "Guardar cambio"
  return "Guardar transferencia"
}

interface QuickAddProps {
  accounts: Account[]
  categories: Category[]
  today: string
}

/** Barra inferior + hoja para registrar un gasto, ingreso o transferencia en segundos. */
export function QuickAdd({ accounts, categories, today }: QuickAddProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<QuickAddType>("expense")
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "")
  const [toAccountId, setToAccountId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [amount, setAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [formKey, setFormKey] = useState(0)
  const [state, setState] = useState<FormState>()
  const [pending, startTransition] = useTransition()

  const isTransfer = type === "transfer"
  const types = accounts.length > 1 ? TYPES : TYPES.filter((t) => t.value !== "transfer")
  const visibleCategories = categories.filter((c) => c.kind === type)
  const account = accounts.find((a) => a.id === accountId) ?? accounts[0]
  const destinations = accounts.filter((a) => a.id !== account?.id)
  const toAccount = destinations.find((a) => a.id === toAccountId) ?? destinations[0]
  const crossCurrency = isTransfer && Boolean(account && toAccount) && account.currency !== toAccount.currency
  const errors = state?.fieldErrors ?? {}

  const cardDebt = isTransfer && toAccount?.type === "credit_card" && toAccount.balanceCents < 0 ? toAccount : null
  const rate =
    crossCurrency && account && toAccount
      ? impliedUsdToPen(
          parseAmountToCents(amount) ?? 0,
          account.currency,
          parseAmountToCents(toAmount) ?? 0,
          toAccount.currency,
        )
      : null

  function openSheet() {
    const last = readLastAccount()
    if (last && accounts.some((a) => a.id === last)) setAccountId(last)
    setState(undefined)
    setOpen(true)
  }

  function changeType(next: QuickAddType) {
    setType(next)
    setCategoryId("")
    setState(undefined)
  }

  function changeFrom(id: string) {
    // Si elige como origen la cuenta destino, se intercambian
    if (id === toAccount?.id) setToAccountId(account?.id ?? "")
    setAccountId(id)
  }

  function payFullDebt() {
    if (!cardDebt) return
    const debt = formatMoney(-cardDebt.balanceCents, cardDebt.currency, { hideSymbol: true })
    if (crossCurrency) setToAmount(debt)
    else setAmount(debt)
  }

  function reset() {
    setAmount("")
    setToAmount("")
    setCategoryId("")
    setFormKey((k) => k + 1) // limpia descripción y fecha
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = isTransfer
        ? await createTransfer(undefined, formData)
        : await createTransaction(undefined, formData)
      setState(result)
      if (!result?.ok) return

      if (!isTransfer) {
        try {
          localStorage.setItem(LAST_ACCOUNT_KEY, accountId)
        } catch {
          // Sin almacenamiento (modo privado): no pasa nada
        }
      }
      toast.success(result.message)
      reset()
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
            <SheetDescription className="sr-only">Registra un gasto, un ingreso o una transferencia</SheetDescription>
          </SheetHeader>

          <form key={formKey} onSubmit={submit} noValidate className="flex flex-col gap-5 px-5">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="accountId" value={account?.id ?? ""} />
            {isTransfer ? (
              <input type="hidden" name="toAccountId" value={toAccount?.id ?? ""} />
            ) : (
              <input type="hidden" name="categoryId" value={categoryId} />
            )}

            <Segmented name="_type" label="Tipo" options={types} value={type} onChange={changeType} />

            {/* Monto */}
            <div className="flex flex-col items-center gap-1">
              <label htmlFor="quick-amount" className="sr-only">
                {crossCurrency ? "Monto que sale" : "Monto"}
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-invalid={Boolean(errors.amount) || undefined}
                  className={cn(
                    "w-44 bg-transparent text-center num text-5xl leading-none outline-none placeholder:text-muted-foreground/40",
                    type === "income" && "text-brand-text",
                  )}
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount[0]}</p>}
            </div>

            {isTransfer ? (
              <>
                <AccountChips
                  legend="Desde"
                  accounts={accounts}
                  value={account?.id}
                  onChange={changeFrom}
                  error={errors.accountId?.[0]}
                />

                <ArrowDown aria-hidden className="-my-2 size-4 self-center text-muted-foreground" />

                <AccountChips
                  legend="Hacia"
                  accounts={destinations}
                  value={toAccount?.id}
                  onChange={setToAccountId}
                  error={errors.toAccountId?.[0]}
                />

                {cardDebt && (
                  <p className="-mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Deuda actual{" "}
                      <span className="num text-foreground">
                        {formatMoney(-cardDebt.balanceCents, cardDebt.currency)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={payFullDebt}
                      className="text-brand-text underline-offset-4 hover:underline"
                    >
                      Pagar todo
                    </button>
                  </p>
                )}

                {crossCurrency && toAccount && (
                  <Field
                    label={`Recibido en ${accountLabel(toAccount)}`}
                    name="toAmount"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    prefix={CURRENCY_SYMBOL[toAccount.currency]}
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    errors={errors.toAmount}
                    hint={rate ? `Tipo de cambio: ${rateFormat.format(rate)}` : "Lo que llegó a la otra cuenta"}
                  />
                )}
              </>
            ) : (
              <>
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

                <AccountChips
                  legend={type === "expense" ? "Pagado con" : "Recibido en"}
                  accounts={accounts}
                  value={account?.id}
                  onChange={setAccountId}
                  error={errors.accountId?.[0]}
                />
              </>
            )}

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Field
                label="Descripción (opcional)"
                name="description"
                placeholder={
                  type === "expense"
                    ? "Menú, taxi, Plaza Vea…"
                    : type === "income"
                      ? "Sueldo de setiembre…"
                      : "Pago de tarjeta, cajero…"
                }
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
            <SubmitButton pending={pending}>{submitLabel(type, account, toAccount)}</SubmitButton>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}

interface AccountChipsProps {
  legend: string
  accounts: Account[]
  value?: string
  onChange: (id: string) => void
  error?: string
}

function AccountChips({ legend, accounts, value, onChange, error }: AccountChipsProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-xs text-muted-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {accounts.map((a) => (
          <button
            key={a.id}
            type="button"
            aria-pressed={a.id === value}
            onClick={() => onChange(a.id)}
            className={cn(
              "h-9 rounded-full border border-line bg-surface px-3.5 text-sm text-muted-foreground",
              a.id === value && "border-foreground/30 bg-surface-2 text-foreground",
            )}
          >
            {accountLabel(a)}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </fieldset>
  )
}
