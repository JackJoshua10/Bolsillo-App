"use client"

import { FormSheet } from "@/components/forms/form-sheet"
import type { Account, Category, TransactionItem } from "@/types/finance"
import { TransactionForm } from "./transaction-form"

interface TransactionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  categories: Category[]
  today: string
  /** Si viene, la hoja edita este movimiento */
  transaction?: TransactionItem
  onSaved: (message: string) => void
  onDelete?: () => void
}

/** Hoja inferior con el formulario de movimiento (nuevo o editar). */
export function TransactionSheet({ open, onOpenChange, transaction, ...formProps }: TransactionSheetProps) {
  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={transaction ? "Editar movimiento" : "Nuevo movimiento"}
      description={transaction ? "Cambia o borra este movimiento" : "Registra un gasto, un ingreso o una transferencia"}
    >
      <TransactionForm key={transaction?.id ?? "new"} transaction={transaction} {...formProps} />
    </FormSheet>
  )
}
