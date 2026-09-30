import { List } from "lucide-react"
import type { Metadata } from "next"

import { ComingSoon } from "@/components/coming-soon"

export const metadata: Metadata = { title: "Movimientos" }

export default function TransactionsPage() {
  return (
    <ComingSoon
      title="Movimientos"
      description="Aquí verás todos tus gastos, ingresos y transferencias, con filtros y buscador."
      Icon={List}
    />
  )
}
