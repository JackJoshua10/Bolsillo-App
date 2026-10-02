@AGENTS.md

# Bolsillo

PWA de finanzas personales. Plan y decisiones en `docs/` (léelos antes de cambios grandes).

**Al empezar una sesión, lee `docs/07-estado-y-continuacion.md`**: estado actual, decisión pendiente con el usuario, próximos pasos y recordatorios (offline, SMTP, color).

- Stack: Next.js 16 (App Router, `proxy.ts` en vez de middleware) · Tailwind 4 · shadcn/ui (radix-nova) · Supabase · pnpm.
- UI en español (es-PE); código, tablas y columnas en inglés.
- Dinero siempre en céntimos (`bigint`/`number` entero) + moneda. Formatear solo con `src/lib/money.ts`.
- Diseño "Graphite Citrine": un solo acento (`brand`), sin sombras, líneas finas (`line`), números con la utilidad `num`. Ver `docs/02-diseno.md`.
- Cambios de esquema: nueva migración en `supabase/migrations/` y extender `supabase/tests/schema.test.mjs`.
- Antes de terminar: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db`.
