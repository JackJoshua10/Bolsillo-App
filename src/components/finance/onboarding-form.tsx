"use client"

import { Banknote, Check, CreditCard, Landmark, type LucideIcon } from "lucide-react"
import { useActionState, useState, useTransition } from "react"

import { Field, FormAlert, SubmitButton } from "@/components/forms/fields"
import { Segmented } from "@/components/forms/segmented"
import type { FormState } from "@/lib/form-state"
import { cn } from "@/lib/utils"
import { createInitialAccounts } from "@/server/actions/finance"

const BANKS = [
  "BCP",
  "Interbank",
  "BBVA",
  "Scotiabank",
  "BanBif",
  "Banco de la Nación",
  "Caja Arequipa",
  "Caja Huancayo",
]

const WALLETS = [
  { value: "", label: "Ninguna" },
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
] as const

const CURRENCIES = [
  { value: "PEN", label: "Soles" },
  { value: "USD", label: "Dólares" },
] as const

export function OnboardingForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createInitialAccounts, undefined)
  const [, startTransition] = useTransition()
  const [cardCurrency, setCardCurrency] = useState<"PEN" | "USD">("PEN")
  const errors = state?.fieldErrors ?? {}

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      // Envío manual para que el formulario no se limpie si hay errores
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        startTransition(() => action(formData))
      }}
    >
      <OptionCard
        name="cash"
        title="Efectivo"
        description="Lo que llevas en la billetera"
        Icon={Banknote}
        defaultChecked
      >
        <Field
          label="¿Cuánto tienes ahora?"
          name="cash_balance"
          prefix="S/"
          inputMode="decimal"
          placeholder="0.00"
          errors={errors.cash_balance}
        />
      </OptionCard>

      <OptionCard
        name="bank"
        title="Cuenta bancaria"
        description="Débito, sueldo o la cuenta de tu Yape/Plin"
        Icon={Landmark}
        defaultChecked
      >
        <Field
          label="Banco"
          name="bank_institution"
          list="banks"
          defaultValue="BCP"
          autoComplete="off"
          errors={errors.bank_institution}
        />
        <datalist id="banks">
          {BANKS.map((bank) => (
            <option key={bank} value={bank} />
          ))}
        </datalist>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">¿Usas Yape o Plin con esta cuenta?</span>
          <Segmented name="bank_wallet" label="Billetera" options={WALLETS} defaultValue="yape" />
        </div>
        <Field
          label="Saldo actual"
          name="bank_balance"
          prefix="S/"
          inputMode="decimal"
          placeholder="0.00"
          hint="Míralo en la app de tu banco."
          errors={errors.bank_balance}
        />
      </OptionCard>

      <OptionCard
        name="card"
        title="Tarjeta de crédito"
        description="Para saber cuánto debes y cuándo pagar"
        Icon={CreditCard}
      >
        <Field label="Nombre" name="card_name" placeholder="Visa BCP" errors={errors.card_name} />
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Moneda</span>
          <Segmented
            name="card_currency"
            label="Moneda de la tarjeta"
            options={CURRENCIES}
            value={cardCurrency}
            onChange={setCardCurrency}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Línea de crédito"
            name="card_limit"
            prefix={cardCurrency === "PEN" ? "S/" : "US$"}
            inputMode="decimal"
            placeholder="0.00"
            errors={errors.card_limit}
          />
          <Field
            label="Deuda actual"
            name="card_debt"
            prefix={cardCurrency === "PEN" ? "S/" : "US$"}
            inputMode="decimal"
            placeholder="0.00"
            errors={errors.card_debt}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Día de corte"
            name="card_statementDay"
            inputMode="numeric"
            placeholder="20"
            errors={errors.card_statementDay}
          />
          <Field
            label="Día de pago"
            name="card_dueDay"
            inputMode="numeric"
            placeholder="15"
            errors={errors.card_dueDay}
          />
        </div>
      </OptionCard>

      <p className="text-xs text-muted-foreground">
        Más adelante podrás agregar otras cuentas (ahorros, dólares, más tarjetas).
      </p>

      <FormAlert error={state?.error} />
      <SubmitButton pending={pending}>Empezar</SubmitButton>
    </form>
  )
}

interface OptionCardProps {
  name: string
  title: string
  description: string
  Icon: LucideIcon
  defaultChecked?: boolean
  children: React.ReactNode
}

/** Tarjeta que se activa con un check y muestra sus campos solo si está activa. */
function OptionCard({ name, title, description, Icon, defaultChecked = false, children }: OptionCardProps) {
  const [checked, setChecked] = useState(defaultChecked)

  return (
    <section className={cn("border border-line bg-surface", checked && "border-brand-text/40")}>
      <label className="flex cursor-pointer items-center gap-3 p-4">
        <input
          type="checkbox"
          name={`${name}_enabled`}
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="peer sr-only"
        />
        <Icon className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        <span className="flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="block text-xs text-muted-foreground">{description}</span>
        </span>
        <span
          aria-hidden
          className={cn(
            "flex size-6 items-center justify-center rounded-full border border-line peer-focus-visible:ring-2 peer-focus-visible:ring-ring/50",
            checked && "border-brand bg-brand text-brand-foreground",
          )}
        >
          {checked && <Check className="size-3.5" strokeWidth={3} />}
        </span>
      </label>
      {checked && <div className="flex flex-col gap-4 border-t border-line p-4">{children}</div>}
    </section>
  )
}
