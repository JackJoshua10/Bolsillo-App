/**
 * Filtros de /movimientos en la URL (en español, porque el usuario los ve):
 * ?periodo=2026-09-15&tipo=gasto&cuenta=<uuid>&categoria=<uuid>&q=taxi
 */

import type { TransactionType } from "@/types/finance"

export const TYPE_PARAM = {
  gasto: "expense",
  ingreso: "income",
  transferencia: "transfer",
} as const satisfies Record<string, TransactionType>

export type TypeParam = keyof typeof TYPE_PARAM

export interface FilterParams {
  /** Cualquier día del periodo a mostrar; sin él, el periodo actual */
  periodo?: string
  tipo?: TypeParam
  cuenta?: string
  categoria?: string
  q?: string
}

type RawParams = Record<string, string | string[] | undefined>

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function isValidDate(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso)
}

/** Lee los filtros de la URL. Lo inválido se ignora (no rompe la página). */
export function parseFilterParams(raw: RawParams, today: string): FilterParams {
  const params: FilterParams = {}

  const periodo = first(raw.periodo)
  if (periodo && ISO_DATE.test(periodo) && isValidDate(periodo) && periodo <= today) params.periodo = periodo

  const tipo = first(raw.tipo)
  if (tipo && tipo in TYPE_PARAM) params.tipo = tipo as TypeParam

  const cuenta = first(raw.cuenta)
  if (cuenta && UUID.test(cuenta)) params.cuenta = cuenta

  const categoria = first(raw.categoria)
  if (categoria && UUID.test(categoria)) params.categoria = categoria

  const q = first(raw.q)?.trim().slice(0, 60)
  if (q) params.q = q

  return params
}

/** URL de /movimientos con `changes` aplicados (undefined o "" quita el filtro). */
export function filtersHref(params: FilterParams, changes: Partial<FilterParams> = {}) {
  const merged = { ...params, ...changes }
  const search = new URLSearchParams()
  for (const key of ["periodo", "tipo", "cuenta", "categoria", "q"] as const) {
    const value = merged[key]
    if (value) search.set(key, value)
  }
  const query = search.toString()
  return query ? `/movimientos?${query}` : "/movimientos"
}

/** ¿Hay algún filtro aparte del periodo? */
export function hasActiveFilters(params: FilterParams) {
  return Boolean(params.tipo || params.cuenta || params.categoria || params.q)
}
