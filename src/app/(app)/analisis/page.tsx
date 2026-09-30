import { ChartPie } from "lucide-react"
import type { Metadata } from "next"

import { ComingSoon } from "@/components/coming-soon"

export const metadata: Metadata = { title: "Análisis" }

export default function AnalyticsPage() {
  return (
    <ComingSoon
      title="Análisis"
      description="Aquí verás en qué gastas por categoría y cómo cambian tus gastos mes a mes."
      Icon={ChartPie}
    />
  )
}
