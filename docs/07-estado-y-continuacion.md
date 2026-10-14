# 07 · Estado actual y cómo continuar

> **Para Claude Code:** lee este archivo al empezar una sesión nueva. Resume las conversaciones previas (la memoria local de Claude Code no viaja entre PCs).
> Última actualización: 2026-10-14 (Análisis).

## Dónde estamos

| Fase             | Estado                                                                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0 · Cimientos    | ✅ Proyecto, diseño, migración inicial, PWA. Desplegado en Vercel. Pendiente: validar el tono exacto del citrino con una captura de la plantilla.                                          |
| 1 · MVP personal | 🟡 En curso. Hecho: login/registro, bienvenida, registro de gasto/ingreso/transferencia, Inicio, Movimientos, Cuentas y Análisis. Desplegada en Vercel e instalada en el iPhone del autor. |

Detalle de tareas en [04 · Funcionalidades y roadmap](04-funcionalidades-y-roadmap.md).

### Lo que ya funciona

- **Auth** (Supabase): registro e inicio de sesión con correo, recuperar contraseña, cerrar sesión. Google: el código está listo, pero el proveedor **no está activado** en Supabase.
- **`/bienvenida`**: crea Efectivo, una cuenta bancaria (con Yape/Plin) y una tarjeta de crédito, cada una con su saldo inicial. El layout de `(app)` redirige aquí si no hay cuentas.
- **Botón +**: hoja para registrar un **gasto o ingreso** (monto, categoría, cuenta, descripción, fecha). Recuerda la última cuenta usada.
- **Transferencias** (pestaña del botón +, solo si hay 2+ cuentas): desde/hacia. Si el destino es una tarjeta con deuda, muestra la deuda y "Pagar todo". Entre monedas pide el monto recibido y guarda el tipo de cambio implícito (`impliedUsdToPen`). No cuentan como gasto ni ingreso del mes.
- **Inicio**: patrimonio neto (suma por moneda, la tarjeta en negativo), gastado e ingresos del mes, cuentas ("Gestionar" → `/cuentas`) y últimos 15 movimientos ("Ver todo" → `/movimientos`).
- **`/movimientos`**: periodo mes a mes (respeta `month_start_day`), filtros por tipo/cuenta/categoría en la URL (`?periodo&tipo&cuenta&categoria&q`, ver `src/lib/transaction-filters.ts`), búsqueda por descripción en todos los meses y totales. Tocar un movimiento (aquí o en Inicio) lo edita en la misma hoja del +; borrar es lógico (`deleted_at`) con "Deshacer". Crear y editar usan una sola acción: `saveTransaction`.
- **`/cuentas`** (desde Inicio o Perfil): agregar efectivo/banco/tarjeta/ahorros en PEN o USD; editar; **ajustar saldo** (crea un movimiento `adjustment` por la diferencia, no toca el saldo inicial); **archivar** solo con saldo 0 (con "Deshacer" y sección "Archivadas" para restaurar). Las tarjetas muestran línea, disponible y próximas fechas de corte y pago. Los ajustes y los movimientos de cuentas archivadas no se pueden editar.
- **`/analisis`**: mismo selector de periodo que Movimientos (`?periodo`, componente `PeriodNav`). Cifras: gastado (con % vs. periodo anterior), ingresos, balance y promedio diario. "En qué gastas": barras horizontales de un color, de mayor a menor; cada fila abre Movimientos filtrado. "Últimos 6 meses": columnas en forma "énfasis" (periodo elegido en `--chart-accent`, el resto en `--chart-muted`), la ventana queda fija mientras el periodo elegido esté entre los 6 últimos, y tiene "Ver como tabla". Solo cuenta soles; los gastos en dólares se avisan aparte. Lógica pura en `src/lib/analytics.ts` (con tests).
- **Perfil**: nombre, correo, enlace a Cuentas, tema (claro/oscuro/sistema) y cerrar sesión.

## Decisión pendiente (preguntar al usuario)

**¿Un solo saldo o varias cuentas?** El usuario dudó si conviene separar efectivo/banco/tarjeta o tener un solo saldo. Se le explicó:

- **Un solo saldo:** más simple, pero la tarjeta de crédito encaja mal (riesgo de contar dos veces o no saber la deuda) y el número no se puede contrastar con el banco.
- **Varias cuentas (implementado):** cada saldo coincide con la realidad y la tarjeta funciona bien (compras = deuda, pago = transferencia).
- **El modelo ya soporta ambas:** con una sola cuenta funciona como "un solo saldo".
- **Recomendación dada:** mantener varias cuentas para su caso (por la tarjeta), y mejorar el modo simple. Por ejemplo, ocultar "Pagado con" si solo hay una cuenta y dejar la tarjeta como opcional.
- **Pregunta abierta:** ¿qué le importa más, "cuánto gasto y en qué" o "cuánto tengo en cada lado y cuánto debo"? **No se hicieron cambios todavía.**

## Próximos pasos (Fase 1)

1. Resolver la decisión de arriba y ajustar la bienvenida y el registro rápido si hace falta.
2. **Perfil**: día de inicio de mes (`profiles.month_start_day`; la lógica `monthRange` ya existe), moneda base y modo privado.
3. **Categorías** (CRUD con ícono y color).
4. Instalarla en el iPhone (Safari → Compartir → Agregar a inicio) y probarla en el día a día.
5. API `/api/v1` + **Atajo de iOS** ([05](05-atajo-ios.md)).

## Recordatorios para Claude

- 🔔 **Offline:** el usuario pidió que le avisemos cuando toque. Momentos: al terminar la Fase 1, antes de invitar a otras personas (Fase 2) o si se decide hacer app nativa.
- 📧 **SMTP propio + plantillas en español:** Supabase Free no deja editar plantillas sin SMTP. Mientras tanto se usan las plantillas por defecto (en inglés, enlace con `?code=`). `/auth/confirm` acepta ese formato. Hacerlo antes de invitar a otras personas.
- 🎨 **Color citrino** `#D4F24A`: es una aproximación. El usuario quiere _exactamente_ el de la plantilla de Sleek. Pedir una captura para ajustarlo.

## Entorno y particularidades

- **Usuario:** ingeniero de sistemas en Perú, usa iPhone, **no tiene Mac**. Trabaja en dos PCs (oficina y casa) y sincroniza por GitHub; quiere todo pusheado a `main`.
- **pnpm 10** (no 12): en la PC de la oficina, Windows "Control de aplicaciones" bloquea `pnpm.exe` (pnpm 12 es binario nativo). pnpm 10 corre como JS. Está fijado en `packageManager`.
- **GitHub CLI (`gh`):** instalado en la oficina pero **sin sesión**. Las ramas se unen a `main` con fast-forward local + push (sin PR).
- **Supabase:** proyecto `bolsillo-dev`, región São Paulo, plan Free.
  - ⚠️ En el plan Free se **pausa** tras ~1 semana sin uso (pasó el 2026-10-08): el panel bloquea Settings → API Keys. Se reactiva con **Resume project** en la página del proyecto; los datos se conservan.
  - Hay otra organización "Bolsillo" con un proyecto `Bolsillo-SupaBase` que la app **no** usa; el bueno es `bolsillo-dev` (ref `phqtyenyfoggmxxvzokh`) en "JackJoshua10's Org".
  - Migraciones aplicadas a mano en el SQL Editor: `20260925000000_init.sql` y `20260930000000_account_wallet.sql`.
  - Auth → URL Configuration: Site URL `https://bolsillo-app-tau.vercel.app`; redirecciones permitidas `http://localhost:3000/**`, `https://bolsillo-app-tau.vercel.app/**` y `https://bolsillo-app-*-jackjoshua10s-projects.vercel.app/**` (previews).
  - Si está pausado, Claude puede reactivarlo con el conector de Supabase (`restore_project`); se hizo el 2026-10-14.
  - Hay **un usuario**: el del autor, ya confirmado. Un primer registro con el correo mal escrito (`gmial.com`) se borró.
- **Vercel:** proyecto `bolsillo-app` (cuenta Hobby de JackJoshua10), producción en **https://bolsillo-app-tau.vercel.app**. Despliega solo en cada push a `main`; las ramas generan previews. Variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en Production y Preview. No se agregó la integración "Supabase" de Vercel (crearía otra base).
- **PC de la oficina:** además de pnpm 12, el Control de aplicaciones bloquea `@next/swc-win32-x64-msvc` (2026-10-14). igual lint/typecheck/tests y `pnpm dev` funcionan (probado 2026-10-14).
- **`.env.local` no está en GitHub.** En cada PC hay que crearlo desde `.env.example` con la Project URL (termina en `.supabase.co`, **sin** `/rest/v1/`) y la Publishable key (`sb_publishable_…`). Ver [06](06-configurar-supabase.md).
- **Next.js 16:** `proxy.ts` reemplaza a `middleware`. Leer `node_modules/next/dist/docs/` antes de usar APIs nuevas (ver `AGENTS.md`).

## Cómo retomar en otra PC

```bash
git clone https://github.com/JackJoshua10/Bolsillo-App.git   # o git pull si ya existe
cd Bolsillo-App
npm i -g pnpm@10      # si no tienes pnpm 10
pnpm install
cp .env.example .env.local   # y pega URL + Publishable key de Supabase
pnpm dev                     # http://localhost:3000
```

Verificación: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.

Al abrir Claude Code, pídele: _"Lee docs/07-estado-y-continuacion.md y continuemos."_
