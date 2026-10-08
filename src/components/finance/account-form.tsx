"use client"

import { useId, useState, useTransition } from "react"

import { Field, FormAlert, SubmitButton } from "@/components/forms/fields"
import { Segmented } from "@/components/forms/segmented"
import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/form-state"
import { CURRENCY_SYMBOL, formatMoney, type Currency } from "@/lib/money"
import { adjustBalance, createAccount, updateAccount } from "@/server/actions/finance"
import { BANKS, type Account, type AccountType } from "@/types/finance"

type FormType = Exclude<AccountType, "wallet">

const TYPES = [
  { value: "cash", label: "Efectivo" },
  { value: "bank", label: "Banco" },
  { value: "credit_card", label: "Tarjeta" },
  { value: "savings", label: "Ahorros" },
] as const

const CURRENCIES = [
  { value: "PEN", label: "Soles" },
  { value: "USD", label: "Dólares" },
] as const

const WALLETS = [
  { value: "", label: "Ninguna" },
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
] as const

const NAME_PLACEHOLDER: Record<FormType, string> = {
  cash: "Efectivo",
  bank: "Cuenta sueldo",
  credit_card: "Visa BCP",
  savings: "Ahorro para viaje",
}

/** Céntimos → texto editable ("1,234.50") */
function amountText(cents: number | null, currency: Currency) {
  return cents ? formatMoney(cents, currency, { hideSymbol: true }) : ""
}

interface AccountFormProps {
  /** Si viene, el formulario edita esta cuenta (tipo y moneda ya no cambian) */
  account?: Account
  onSaved: (message: string) => void
}

/** Datos de una cuenta: nueva (con saldo inicial) o editar. */
export function AccountForm({ account, onSaved }: AccountFormProps) {
  const banksId = useId()
  const [type, setType] = useState<FormType>(account && account.type !== "wallet" ? account.type : "bank")
  const [currency, setCurrency] = useState<Currency>(account?.currency ?? "PEN")
  const [state, setState] = useState<FormState>()
  const [pending, startTransition] = useTransition()
  const errors = state?.fieldErrors ?? {}
  const symbol = CURRENCY_SYMBOL[currency]
  const isCard = type === "credit_card"

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = account ? await updateAccount(undefined, formData) : await createAccount(undefined, formData)
      setState(result)
      if (result?.ok) onSaved(result.message ?? "Guardado")
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 px-5">
      {account ? (
        <input type="hidden" name="id" value={account.id} />
      ) : (
        <>
          <Segmented
            name="type"
            label="Tipo de cuenta"
            options={TYPES}
            value={type}
            onChange={(next) => {
              setType(next)
              setState(undefined)
            }}
          />
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">Moneda</span>
            <Segmented name="currency" label="Moneda" options={CURRENCIES} value={currency} onChange={setCurrency} />
          </div>
        </>
      )}

      {type !== "cash" && (
        <>
          <Field
            label={isCard ? "Banco (opcional)" : type === "savings" ? "Banco o caja" : "Banco"}
            name="institution"
            list={banksId}
            autoComplete="off"
            defaultValue={account?.institution ?? (account ? "" : "BCP")}
            errors={errors.institution}
          />
          <datalist id={banksId}>
            {BANKS.map((bank) => (
              <option key={bank} value={bank} />
            ))}
          </datalist>
        </>
      )}

      <Field
        label={isCard ? "Nombre" : "Nombre (opcional)"}
        name="name"
        placeholder={NAME_PLACEHOLDER[type]}
        defaultValue={account?.name ?? ""}
        maxLength={40}
        errors={errors.name}
        hint={!isCard && type !== "cash" ? "Si lo dejas vacío, usamos el nombre del banco." : undefined}
      />

      {type === "bank" && currency === "PEN" && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">¿Usas Yape o Plin con esta cuenta?</span>
          <Segmented name="wallet" label="Billetera" options={WALLETS} defaultValue={account?.wallet ?? ""} />
        </div>
      )}

      {isCard && (
        <>
          <Field
            label="Línea de crédito"
            name="limit"
            prefix={symbol}
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={amountText(account?.creditLimitCents ?? null, currency)}
            errors={errors.limit}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Día de corte"
              name="statementDay"
              inputMode="numeric"
              placeholder="20"
              defaultValue={account?.statementDay ?? ""}
              errors={errors.statementDay}
            />
            <Field
              label="Día de pago"
              name="dueDay"
              inputMode="numeric"
              placeholder="15"
              defaultValue={account?.dueDay ?? ""}
              errors={errors.dueDay}
            />
          </div>
        </>
      )}

      {!account && (
        <Field
          label={isCard ? "Deuda actual" : "Saldo actual"}
          name="balance"
          prefix={symbol}
          inputMode="decimal"
          placeholder="0.00"
          errors={errors.balance}
          hint={isCard ? "Lo que debes hoy, según la app de tu banco." : undefined}
        />
      )}

      <FormAlert error={state?.error} />
      <SubmitButton pending={pending}>{account ? "Guardar cambios" : "Agregar cuenta"}</SubmitButton>
    </form>
  )
}

/** Escribe el saldo real y se crea un ajuste por la diferencia. */
export function AdjustBalanceForm({ account, onSaved }: { account: Account; onSaved: (message: string) => void }) {
  const [state, setState] = useState<FormState>()
  const [pending, startTransition] = useTransition()
  const isCard = account.type === "credit_card"
  const current = isCard ? -account.balanceCents : account.balanceCents

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await adjustBalance(undefined, formData)
      setState(result)
      if (result?.ok) onSaved(result.message ?? "Guardado")
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 px-5">
      <input type="hidden" name="id" value={account.id} />
      <Field
        label={isCard ? "Deuda real" : "Saldo real"}
        name="balance"
        prefix={CURRENCY_SYMBOL[account.currency]}
        inputMode="decimal"
        placeholder="0.00"
        defaultValue={current > 0 ? amountText(current, account.currency) : ""}
        errors={state?.fieldErrors?.balance}
        hint="¿No coincide con tu banco? Escribe el real y registramos un ajuste por la diferencia."
      />
      <FormAlert error={state?.error} />
      <Button type="submit" variant="outline" disabled={pending} className="h-11 bg-surface text-base">
        Ajustar saldo
      </Button>
    </form>
  )
}
