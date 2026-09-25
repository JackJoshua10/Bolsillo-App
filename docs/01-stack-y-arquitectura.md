# 01 · Stack y arquitectura

## Stack

| Capa | Tecnología | Notas |
|---|---|---|
| Lenguaje | **TypeScript** (strict) | En todo el proyecto |
| Framework | **Next.js** (App Router) | Frontend y API en un solo proyecto |
| UI | **Tailwind CSS** + **shadcn/ui** (Radix) | Los componentes se copian al repo y se adaptan al diseño |
| Íconos | **Lucide** | |
| Gráficos | **Recharts** | Donut de categorías, barras mensuales, sparkline |
| Formularios | **react-hook-form** + **Zod** | Los mismos esquemas Zod validan en el cliente y en el servidor |
| Estado del servidor | **TanStack Query** | Caché, refetch y actualizaciones optimistas al agregar gastos |
| Backend y datos | **Supabase** (Postgres + Auth + RLS + Storage) | Plan gratis al inicio |
| Auth | Supabase Auth: **Google OAuth** y **email/contraseña** | Con `@supabase/ssr` para las cookies en Next |
| Migraciones | **Supabase CLI** (`supabase/migrations/*.sql`) | Tipos TS generados con `supabase gen types` |
| PWA | **Serwist** (manifest + service worker) | Instalable. Offline completo pospuesto |
| Fechas | **date-fns** (zona `America/Lima`) | |
| Tests | **Vitest** (unitarios) + **Playwright** (e2e) | |
| Calidad | ESLint + Prettier + Husky/lint-staged | |
| Paquetes | **pnpm** | |
| Hosting | **Vercel** | Deploy automático desde `main`, con preview por cada PR |
| Errores | **Sentry** (plan gratis) | A partir de la fase 2 |
| Tipo de cambio | API pública de tipo de cambio SUNAT + **edición manual** | Proveedor exacto por definir (ver el roadmap) |

> Desarrollo local en Windows: la Supabase CLI local necesita **Docker Desktop**. Como alternativa se puede usar un proyecto Supabase "dev" en la nube y otro "prod".

## Arquitectura

```
iPhone (PWA en Safari)  ──┐
Atajo iOS (HTTP POST)   ──┼──►  Next.js en Vercel
Futuro: app nativa      ──┘      ├─ Páginas (Server Components)
                                 ├─ Server Actions  ← mutaciones desde la UI
                                 └─ /api/v1/*       ← API REST pública (Atajo, app nativa)
                                          │
                                          ▼
                                 Supabase (Postgres + RLS + Auth)
```

**Principios**

1. **La lógica de negocio vive en `src/server/`**, no en los componentes. Las Server Actions y `/api/v1` llaman a las mismas funciones, así que una futura app nativa usaría exactamente la misma lógica.
2. **Seguridad en la base de datos (RLS):** aunque haya un bug en el frontend, un usuario nunca puede leer datos de otro espacio.
3. **API versionada (`/api/v1`)** desde el inicio, para no romper el Atajo ni la futura app cuando cambie algo.
4. **Dinero siempre en céntimos (`bigint`)** y moneda explícita. Solo se formatea en la UI con `Intl.NumberFormat('es-PE')`.

## Estructura de carpetas (propuesta)

```
bolsillo/
├─ docs/                      # esta documentación
├─ public/                    # íconos PWA, manifest
├─ supabase/
│  ├─ migrations/             # SQL versionado
│  └─ seed.sql                # categorías por defecto, datos demo
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login, registro
│  │  ├─ (app)/               # rutas protegidas
│  │  │  ├─ inicio/           # Resumen
│  │  │  ├─ movimientos/
│  │  │  ├─ cuentas/
│  │  │  ├─ analisis/
│  │  │  ├─ metas/            # v2
│  │  │  └─ perfil/
│  │  └─ api/v1/              # REST para el Atajo y clientes externos
│  ├─ components/
│  │  ├─ ui/                  # shadcn adaptados (Button, Sheet, ...)
│  │  └─ finance/             # AmountDisplay, TransactionRow, AccountTile...
│  ├─ server/                 # lógica de negocio (services) + queries
│  ├─ lib/                    # supabase clients, money.ts, dates.ts, utils
│  ├─ schemas/                # Zod
│  └─ types/                  # tipos generados de Supabase
└─ tests/
```

## Convenciones

- **Git:** `main` protegida, ramas `feat/...`, `fix/...`, commits con [Conventional Commits](https://www.conventionalcommits.org/).
- **Código en inglés** (nombres de variables, tablas, columnas) y **UI en español**.
- **Entornos:** `local` → `preview` (Vercel, por PR) → `production`.
- **Secretos** en `.env.local` (nunca se commitean) y en variables de entorno de Vercel.
