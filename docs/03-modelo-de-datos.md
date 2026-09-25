# 03 · Modelo de datos

Base: **Postgres (Supabase)**. Todas las tablas tienen `id uuid`, `created_at` y `updated_at`.

## Concepto clave: Espacios

Toda la información financiera (cuentas, categorías, movimientos, presupuestos) pertenece a un **espacio**, no directamente a un usuario.

- Al registrarse, cada usuario recibe automáticamente su espacio **Personal** (privado, solo él).
- Puede crear **espacios compartidos** (por ejemplo "Casa", "Viaje Cusco") e invitar a otros usuarios.
- La seguridad se resuelve con una sola regla: *"puedes ver o editar filas de un espacio si eres miembro de ese espacio"*.

Así se cumplen los dos requisitos (finanzas separadas y cuentas compartidas) con un solo mecanismo, sin duplicar lógica.

```
auth.users ─1:1─ profiles
     │
     └─< space_members >─ spaces ─┬─< accounts ─< transactions
                                  ├─< categories ─┘
                                  ├─< budgets (v2)
                                  ├─< recurring_rules (v2)
                                  └─< goals (v2)
exchange_rates (global)
api_tokens (por usuario)
```

## Tablas

### `profiles`
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK = auth.users.id | |
| display_name | text | |
| avatar_url | text | |
| base_currency | `currency` enum | Por defecto `PEN`. Moneda en la que se muestran los totales |
| theme | text | `system` / `light` / `dark` |
| month_start_day | smallint 1–28 | Por defecto 1 (mes calendario). Si es 15, el "mes" va del 15 al 14 |
| default_space_id | uuid FK | |

### `spaces`
| Columna | Tipo | Notas |
|---|---|---|
| name | text | |
| kind | enum `personal` / `shared` | |
| created_by | uuid FK profiles | |

### `space_members`
| Columna | Tipo | Notas |
|---|---|---|
| space_id, user_id | PK compuesta | |
| role | enum `owner` / `editor` / `viewer` | |

### `space_invitations`
`space_id`, `email`, `role`, `token_hash`, `expires_at`, `accepted_at`

### `accounts`
| Columna | Tipo | Notas |
|---|---|---|
| space_id | uuid FK | |
| name | text | "Efectivo", "BCP", "Visa BCP" |
| type | enum `cash` / `wallet` / `bank` / `credit_card` / `savings` | Ver "Yape y Plin" abajo |
| institution | text null | "BCP", "Interbank", ... (para mostrar el logo o color) |
| currency | enum `PEN` / `USD` | **Una cuenta tiene una sola moneda** |
| opening_balance_cents | bigint | Saldo inicial (en tarjeta, deuda inicial como negativo) |
| credit_limit_cents | bigint null | Solo en tarjetas |
| statement_day | smallint null | Día de corte (tarjeta) |
| due_day | smallint null | Día de pago (tarjeta) |
| card_group_id | uuid null | Une las dos cuentas PEN/USD de una **tarjeta bimoneda** |
| color, icon, sort_order | | |
| archived_at | timestamptz null | Se archiva, nunca se borra si tiene movimientos |

### `categories`
| Columna | Tipo | Notas |
|---|---|---|
| space_id | uuid FK | |
| kind | enum `expense` / `income` | |
| name, icon, color | | |
| parent_id | uuid null | Subcategorías (opcional, v2) |
| archived_at | | |

Categorías por defecto (seed al crear un espacio): Comida, Supermercado, Transporte, Vivienda, Servicios, Salud, Entretenimiento, Suscripciones, Ropa, Educación, Regalos, Otros. Ingresos: Sueldo, Freelance, Reembolso, Otros.

### `transactions`
| Columna | Tipo | Notas |
|---|---|---|
| space_id | uuid FK | |
| type | enum `expense` / `income` / `transfer` / `adjustment` | |
| account_id | uuid FK | Cuenta origen (o única) |
| amount_cents | bigint > 0 | Siempre positivo. El signo lo da `type` |
| currency | enum | Copiada de la cuenta (inmutable) |
| to_account_id | uuid null | Solo en `transfer` |
| to_amount_cents | bigint null | Monto recibido (difiere si hay cambio de moneda) |
| exchange_rate | numeric(12,6) null | Tipo de cambio usado en la transferencia PEN↔USD |
| category_id | uuid null | Obligatorio en expense/income |
| payment_method | enum null `yape` / `plin` / `debit_card` / `bank_transfer` / `cash` / `credit_card` | **Cómo** se pagó (la cuenta dice **de dónde** salió) |
| description | text | |
| occurred_on | date | Fecha del gasto (no la de registro) |
| created_by | uuid FK | Quién lo registró (útil en espacios compartidos) |
| source | enum `app` / `shortcut` / `import` / `recurring` | |
| deleted_at | timestamptz null | Borrado lógico, para poder deshacer |

Índices: `(space_id, occurred_on desc)`, `(account_id, occurred_on)`, `(category_id)`.

### `exchange_rates`
`date`, `base` (USD), `quote` (PEN), `rate_buy`, `rate_sell`, `source` (`sunat` / `manual`). Única por `(date, base, quote)`.

### `api_tokens`
`user_id`, `name` ("iPhone de Jack"), `token_hash` (el token se muestra una sola vez), `default_space_id`, `default_account_id`, `last_used_at`, `revoked_at`.

### Fase 2
- `budgets`: `space_id`, `category_id` (null = global), `period` (monthly), `amount_cents`, `currency`.
- `recurring_rules`: plantilla de movimiento + `rrule` / frecuencia + `next_run_on`.
- `goals`: `name`, `target_cents`, `currency`, `account_id` opcional, `deadline`.

## Reglas de negocio

**Saldo de una cuenta**
```
saldo = opening_balance
      + Σ income
      − Σ expense
      − Σ transfer donde account_id = cuenta      (amount_cents)
      + Σ transfer donde to_account_id = cuenta   (to_amount_cents)
      ± Σ adjustment
```
Se calcula con una vista o función SQL (`account_balances`). Si en el futuro hay mucho volumen se cachea.

**Tarjeta de crédito**
- Un gasto con tarjeta **reduce** su saldo (queda negativo = deuda). No cuenta como salida de efectivo, pero **sí cuenta como gasto** en Análisis, en la fecha en que se hizo la compra.
- **Pagar la tarjeta** = transferencia desde Yape o Efectivo hacia la tarjeta. **No es un gasto**, así no se cuenta doble.
- Crédito disponible = límite + saldo (el saldo es negativo).
- Tarjeta **bimoneda**: dos cuentas (PEN y USD) con el mismo `card_group_id`, que comparten el límite.
- Con `statement_day` y `due_day` se calcula "Facturado este ciclo" y "Pagar antes del ...".

**Yape y Plin**
- En la mayoría de casos Yape/Plin **no es una cuenta**: es un medio de pago de una cuenta bancaria. Se modela como una cuenta `bank` ("BCP") y cada movimiento lleva `payment_method = 'yape'`. Así el saldo coincide con el del banco y aun se puede ver "cuánto gasté por Yape".
- Si alguien usa Yape **sin banco** (billetera independiente), se crea como cuenta `wallet`.
- En la UI, la cuenta puede mostrarse como "BCP · Yape" para que se reconozca rápido.

**Mes y periodos**
- Los reportes "del mes" usan `month_start_day` del perfil. Con 1 es el mes calendario.
- El ciclo de la tarjeta (corte y pago) es independiente del mes del usuario.

**Monedas**
- Cada movimiento queda en la moneda de su cuenta. Nunca se convierte al guardar.
- Los **totales** (patrimonio, gasto del mes) se convierten a `base_currency` usando el tipo de cambio del día del movimiento. Si no hay tipo de cambio de ese día, se usa el último disponible.
- El tipo de cambio para los totales viene de **SUNAT** (job diario). Se guarda el histórico para que los meses pasados no cambien de valor.
- Compras en dólares con una tarjeta en soles (Netflix, Amazon): se registran en **soles**, por el monto que cobra el banco.
- **Cambio de dólares** (por ejemplo, en una casa de cambio) = `transfer` de la cuenta USD a la cuenta PEN con `amount_cents`, `to_amount_cents` y `exchange_rate`.

## Seguridad (RLS)

- Función `is_space_member(space_id, min_role)` con `security definer`.
- `select`: miembro con cualquier rol. `insert/update/delete`: `editor` u `owner`. Gestión de miembros: solo `owner`.
- `/api/v1` con token del Atajo: el servidor valida el hash del token, identifica al usuario y ejecuta la operación **con los permisos de ese usuario** (sin saltarse RLS).
- Trigger `on auth.users insert` que crea `profiles`, el espacio Personal, la membresía `owner` y las categorías por defecto.
