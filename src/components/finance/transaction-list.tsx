"use client"

import { useState } from "react"
import { toast } from "sonner"

import { dayLabel } from "@/lib/dates"
import { deleteTransaction, restoreTransaction } from "@/server/actions/finance"
import type { Account, Category, TransactionItem } from "@/types/finance"
import { TransactionRow } from "./transaction-row"
import { TransactionSheet } from "./transaction-sheet"

function groupByDay(items: TransactionItem[]) {
  const groups = new Map<string, TransactionItem[]>()
  for (const t of items) groups.set(t.occurredOn, [...(groups.get(t.occurredOn) ?? []), t])
  return [...groups.entries()]
}

const DELETE_ERROR = "No pudimos borrarlo. Revisa tu conexión e inténtalo de nuevo."

interface TransactionListProps {
  transactions: TransactionItem[]
  accounts: Account[]
  categories: Category[]
  today: string
}

/** Movimientos agrupados por día. Al tocar uno se abre para editarlo o borrarlo. */
export function TransactionList({ transactions, accounts, categories, today }: TransactionListProps) {
  const [selected, setSelected] = useState<TransactionItem>()
  const [open, setOpen] = useState(false)

  function select(t: TransactionItem) {
    setSelected(t)
    setOpen(true)
  }

  async function remove() {
    if (!selected) return
    const { id } = selected
    setOpen(false)

    const result = await deleteTransaction(id)
    if (!result.ok) {
      toast.error(DELETE_ERROR)
      return
    }
    toast.success("Movimiento borrado", {
      action: {
        label: "Deshacer",
        onClick: async () => {
          const restored = await restoreTransaction(id)
          if (!restored.ok) toast.error("No pudimos recuperarlo. Inténtalo de nuevo.")
        },
      },
    })
  }

  return (
    <>
      {groupByDay(transactions).map(([date, items]) => (
        <div key={date} className="mt-4">
          <p className="text-[11px] text-muted-foreground first-letter:uppercase">{dayLabel(date, today)}</p>
          <ul className="mt-1">
            {items.map((t, i) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                isFirst={i === 0}
                isLast={i === items.length - 1}
                onSelect={t.type === "adjustment" ? undefined : () => select(t)}
              />
            ))}
          </ul>
        </div>
      ))}

      <TransactionSheet
        open={open}
        onOpenChange={setOpen}
        accounts={accounts}
        categories={categories}
        today={today}
        transaction={selected}
        onSaved={(message) => {
          toast.success(message)
          setOpen(false)
        }}
        onDelete={remove}
      />
    </>
  )
}
