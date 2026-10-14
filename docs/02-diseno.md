# 02 · Diseño

Referencia: [Sleek · Fintech App template](https://sleek.design/es/templates/fintech-app), estilo **"Graphite Citrine"**.

## Principios de la línea visual (se mantienen en toda pantalla nueva)

1. **Un solo acento: citrino eléctrico.** Se usa solo para la acción principal, el estado activo de la navegación, los deltas positivos y los ingresos. Nunca como fondo grande.
2. **Paneles tonales en vez de sombras.** La profundidad viene de cambiar el tono del fondo (fondo, superficie, superficie elevada) y de **líneas finas de 1px**. Nada de drop shadows ni tarjetas flotantes.
3. **Números monoespaciados tabulares.** Saldos, montos y porcentajes van en fuente mono con `font-variant-numeric: tabular-nums`, alineados a la derecha, para que se lean como un instrumento de precisión.
4. **"Ledger spine":** en la lista de movimientos, una línea vertical fina con nodos (en citrino para ingresos y en neutro para gastos).
5. **Navegación inferior delgada** con un subrayado citrino en el ítem activo. El botón "+" central es el único elemento relleno en citrino.
6. **Rojo mínimo:** los gastos van en color de texto normal con signo "−". El rojo se reserva para alertas (presupuesto excedido, pago de tarjeta vencido).

## Tokens de color

> ⚠️ La plantilla no publica sus códigos hex. Estos valores reproducen el estilo descrito y hay que **validarlos contra una captura** de la plantilla antes de programar.

El citrino puro sobre blanco no tiene contraste suficiente para texto (WCAG). Por eso en modo claro el citrino se usa como **relleno** (con texto oscuro encima) y para **texto o íconos** se usa una variante oliva oscura.

| Token           | Oscuro    | Claro     | Uso                                           |
| --------------- | --------- | --------- | --------------------------------------------- |
| `--bg`          | `#0E0F0E` | `#F5F3EC` | Fondo de la app (grafito / hueso)             |
| `--surface`     | `#161817` | `#FFFFFF` | Paneles                                       |
| `--surface-2`   | `#1D201E` | `#EEEBE2` | Panel elevado, inputs, hover                  |
| `--line`        | `#2A2E2B` | `#DEDAD0` | Líneas finas y separadores                    |
| `--text`        | `#ECE7DB` | `#171917` | Texto principal (hueso / grafito)             |
| `--text-muted`  | `#8E8A80` | `#6A665D` | Texto secundario                              |
| `--accent`      | `#D4F24A` | `#D4F24A` | Relleno: botón primario, FAB, chip activo     |
| `--accent-fg`   | `#0E0F0E` | `#171917` | Texto sobre el acento                         |
| `--accent-text` | `#D4F24A` | `#5A6B00` | Texto o íconos en acento (ingresos, deltas +) |
| `--danger`      | `#FF6A55` | `#C8372A` | Alertas y errores                             |
| `--warning`     | `#F5B544` | `#A86A00` | Presupuesto cerca del límite                  |

Colores de categorías: paleta secundaria desaturada (8 a 10 tonos) que no compita con el citrino. Se define en la fase de diseño de componentes.

**Gráficos.** Por ahora todos son de una sola serie, así que no usan colores por categoría: forma "énfasis" con dos tokens validados (contraste ≥ 3:1 sobre `--bg` y separación con daltonismo).

| Token            | Claro     | Oscuro    | Uso                                            |
| ---------------- | --------- | --------- | ---------------------------------------------- |
| `--chart-accent` | `#5A6B00` | `#D4F24A` | Barra o columna destacada, barras de categoría |
| `--chart-muted`  | `#8D897E` | `#666A64` | Columnas de contexto (otros periodos)          |

Reglas: barras ≤ 24px con 4px redondeados solo en el extremo de datos, línea base fina, sin ejes dobles, rótulos selectivos (el resto en hover/foco y en "Ver como tabla"), texto siempre en colores de texto (nunca del color de la serie). Dona/pastel solo para ≤ 6 partes muy distintas; para comparar categorías se usan barras.

## Tipografía

| Rol              | Fuente                            | Notas                                            |
| ---------------- | --------------------------------- | ------------------------------------------------ |
| UI / textos      | **Inter**                         | 400 / 500 / 600                                  |
| Montos y números | **JetBrains Mono** (o Geist Mono) | `tabular-nums`. Saldo principal grande (40–48px) |

## Componentes base

- `AmountDisplay`: monto + moneda (`S/` o `US$`), con signo, color según el tipo y opción de ocultarlo (modo privado 👁).
- `AccountTile`: ícono, nombre, saldo y moneda. En tarjetas de crédito, barra de uso del límite.
- `TransactionRow`: nodo en el "spine", categoría, descripción, cuenta y monto a la derecha.
- `QuickAddSheet`: hoja inferior con teclado numérico propio, selector de categoría (grid de íconos) y cuenta.
- `BottomNav`: Inicio · Movimientos · **(+)** · Análisis · Perfil.
- `Sparkline` / `DonutChart` / `BarChart`: con el estilo de líneas finas y el acento citrino.
- `SegmentedControl`: Gasto / Ingreso / Transferencia; Mes / Año.
- `EmptyState`: importante porque el usuario empieza de cero.

## Mapeo plantilla → Bolsillo

| Plantilla Sleek | Bolsillo                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------- |
| Overview        | **Inicio**: patrimonio neto (PEN, con equivalente en USD), gasto del mes, cuentas y tendencia |
| Ledger          | **Movimientos**: agrupados por día, con filtros                                               |
| Virtual Card    | **Detalle de cuenta**: tarjeta de crédito con límite, fecha de corte, fecha de pago y deuda   |
| Transfer Funds  | **Transferencia** entre cuentas (incluye cambio PEN↔USD y pago de tarjeta)                    |
| Insights        | **Análisis**: por categoría y comparación mensual                                             |
| Invest          | **Metas de ahorro** (v2)                                                                      |
| Profile         | **Perfil**: ajustes, categorías, espacios compartidos y token del Atajo                       |
| (nuevo)         | **Agregar movimiento** (sheet), **Espacios**, **Presupuestos** (v2), **Onboarding**           |

## Pantallas nuevas que siguen la misma línea

- **Onboarding** (primer uso): crear las cuentas iniciales (Efectivo, Yape, Tarjeta) con su saldo de apertura.
- **Selector de espacio** (arriba en Inicio): "Personal" / "Casa" / ...
- **Invitar miembro** a un espacio compartido.
