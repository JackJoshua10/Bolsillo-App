"use client"

import { useState } from "react"
import { toast } from "sonner"

import { BottomNav } from "@/components/bottom-nav"
import type { Account, Category } from "@/types/finance"
import { TransactionSheet } from "./transaction-sheet"

interface QuickAddProps {
  accounts: Account[]
  categories: Category[]
  today: string
}

/** Barra inferior + hoja para registrar un gasto, ingreso o transferencia en segundos. */
export function QuickAdd({ accounts, categories, today }: QuickAddProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <BottomNav onAdd={() => setOpen(true)} />
      <TransactionSheet
        open={open}
        onOpenChange={setOpen}
        accounts={accounts}
        categories={categories}
        today={today}
        onSaved={(message) => {
          toast.success(message)
          setOpen(false)
        }}
      />
    </>
  )
}
