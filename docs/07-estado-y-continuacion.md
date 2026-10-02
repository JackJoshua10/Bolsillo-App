# 07 · Estado actual y cómo continuar

> **Para Claude Code:** lee este archivo al empezar una sesión nueva. Resume las conversaciones previas (la memoria local de Claude Code no viaja entre PCs).
> Última actualización: 2026-10-02.

## Dónde estamos

| Fase             | Estado                                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 · Cimientos    | ✅ Proyecto, diseño, migración inicial, PWA. Pendiente: validar el tono exacto del citrino con una captura de la plantilla y conectar Vercel. |
| 1 · MVP personal | 🟡 En curso. Hecho: login/registro, bienvenida (crear cuentas), registro rápido de gasto/ingreso, Inicio con datos reales.                    |

Detalle de tareas en [04 · Funcionalidades y roadmap](04-funcionalidades-y-roadmap.md).

### Lo que ya funciona

- **Auth** (Supabase): registro e inicio de sesión con correo, recuperar contraseña, cerrar sesión. Google: el código está listo, pero el proveedor **no está activado** en Supabase.
- **`/bienvenida`**: crea Efectivo, una cuenta bancaria (con Yape/Plin) y una tarjeta de crédito, cada una con su saldo inicial. El layout de `(app)` redirige aquí si no hay cuentas.
- **Botón +**: hoja para registrar un **gasto o ingreso** (monto, categoría, cuenta, descripción, fecha). Recuerda la última cuenta usada.
- **Inicio**: patrimonio neto (suma por moneda, la tarjeta en negativo), gastado e ingresos del mes, cuentas y últimos 15 movimientos.
- **Perfil**: nombre, correo, tema (claro/oscuro/sistema) y cerrar sesión. **Movimientos** y **Análisis** son placeholders.

## Decisión pendiente (preguntar al usuario)

**¿Un solo saldo o varias cuentas?** El usuario dudó si conviene separar efectivo/banco/tarjeta o tener un solo saldo. Se le explicó:

- **Un solo saldo:** más simple, pero la tarjeta de crédito encaja mal (riesgo de contar dos veces o no saber la deuda) y el número no se puede contrastar con el banco.
- **Varias cuentas (implementado):** cada saldo coincide con la realidad y la tarjeta funciona bien (compras = deuda, pago = transferencia).
- **El modelo ya soporta ambas:** con una sola cuenta funciona como "un solo saldo".
- **Recomendación dada:** mantener varias cuentas para su caso (por la tarjeta), y mejorar el modo simple. Por ejemplo, ocultar "Pagado con" si solo hay una cuenta y dejar la tarjeta como opcional.
- **Pregunta abierta:** ¿qué le importa más, "cuánto gasto y en qué" o "cuánto tengo en cada lado y cuánto debo"? **No se hicieron cambios todavía.**

## Próximos pasos (Fase 1)

1. Resolver la decisión de arriba y ajustar la bienvenida y el registro rápido si hace falta.
2. **Transferencias**: pagar la tarjeta desde el banco, sacar efectivo, cambio de dólares. El backend ya las soporta; falta la UI en la hoja del +.
3. **Movimientos**: lista completa con filtros, editar, borrar (borrado lógico con `deleted_at`) y deshacer.
4. **Cuentas**: agregar más (ahorros, dólares, más tarjetas), editar, ajustar saldo (`type = 'adjustment'`) y archivar.
5. **Perfil**: día de inicio de mes (`profiles.month_start_day`; la lógica `monthRange` ya existe).
6. Conectar **Vercel** para usarla en el iPhone.
7. API `/api/v1` + **Atajo de iOS** ([05](05-atajo-ios.md)).

## Recordatorios para Claude

- 🔔 **Offline:** el usuario pidió que le avisemos cuando toque. Momentos: al terminar la Fase 1, antes de invitar a otras personas (Fase 2) o si se decide hacer app nativa.
- 📧 **SMTP propio + plantillas en español:** Supabase Free no deja editar plantillas sin SMTP. Mientras tanto se usan las plantillas por defecto (en inglés, enlace con `?code=`). `/auth/confirm` acepta ese formato. Hacerlo antes de invitar a otras personas.
- 🎨 **Color citrino** `#D4F24A`: es una aproximación. El usuario quiere _exactamente_ el de la plantilla de Sleek. Pedir una captura para ajustarlo.

## Entorno y particularidades

- **Usuario:** ingeniero de sistemas en Perú, usa iPhone, **no tiene Mac**. Trabaja en dos PCs (oficina y casa) y sincroniza por GitHub; quiere todo pusheado a `main`.
- **pnpm 10** (no 12): en la PC de la oficina, Windows "Control de aplicaciones" bloquea `pnpm.exe` (pnpm 12 es binario nativo). pnpm 10 corre como JS. Está fijado en `packageManager`.
- **GitHub CLI (`gh`):** instalado en la oficina pero **sin sesión**. Las ramas se unen a `main` con fast-forward local + push (sin PR).
- **Supabase:** proyecto `bolsillo-dev`, región São Paulo, plan Free.
  - Migraciones aplicadas a mano en el SQL Editor: `20260925000000_init.sql` y `20260930000000_account_wallet.sql`.
  - Auth → URL Configuration: Site URL `http://localhost:3000`, redirección permitida `http://localhost:3000/**`.
  - Hay **un usuario**: el del autor, ya confirmado. Un primer registro con el correo mal escrito (`gmial.com`) se borró.
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
