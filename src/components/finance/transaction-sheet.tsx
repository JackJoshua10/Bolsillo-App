"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92dvh] max-w-md gap-0 overflow-y-auto rounded-t-2xl border-line bg-background pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-none"
      >
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle>{transaction ? "Editar movimiento" : "Nuevo movimiento"}</SheetTitle>
          <SheetDescription className="sr-only">
            {transaction ? "Cambia o borra este movimiento" : "Registra un gasto, un ingreso o una transferencia"}
          </SheetDescription>
        </SheetHeader>
        <TransactionForm key={transaction?.id ?? "new"} transaction={transaction} {...formProps} />
      </SheetContent>
    </Sheet>
  )
}
