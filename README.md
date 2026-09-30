# Bolsillo

App de finanzas personales para registrar gastos, ingresos y transferencias en soles y dólares, con cuentas personales y compartidas.

- Web instalable (PWA) optimizada para iPhone. También funciona en Android y en desktop.
- Registro rápido desde el Centro de Control, la pantalla de bloqueo o Siri mediante un Atajo de iOS.
- Pensada para escalar: primero uso personal, después amigos y, más adelante, publicación.

## Documentación de planificación

| Doc                                                                    | Contenido                                                              |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [00 · Visión y decisiones](docs/00-vision-y-decisiones.md)             | Qué es, para quién y las decisiones ya tomadas                         |
| [01 · Stack y arquitectura](docs/01-stack-y-arquitectura.md)           | Tecnologías, estructura del proyecto y convenciones                    |
| [02 · Diseño](docs/02-diseno.md)                                       | Línea visual, tokens de color (claro/oscuro), tipografía y componentes |
| [03 · Modelo de datos](docs/03-modelo-de-datos.md)                     | Tablas, relaciones, seguridad (RLS) y reglas de negocio                |
| [04 · Funcionalidades y roadmap](docs/04-funcionalidades-y-roadmap.md) | Pantallas y fases (MVP → v2 → v3)                                      |
| [05 · Atajo de iOS](docs/05-atajo-ios.md)                              | Registro rápido desde el Centro de Control                             |
| [06 · Configurar Supabase](docs/06-configurar-supabase.md)             | Crear el proyecto, variables, tablas, correos y Google                 |

## Estado

🟡 **Fase 0 · Cimientos**: proyecto base, diseño y esquema de base de datos listos. Falta conectar Supabase y Vercel.

## Desarrollo

Requisitos: Node 24+, pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Comando                        | Qué hace                                                 |
| ------------------------------ | -------------------------------------------------------- |
| `pnpm test`                    | Tests unitarios (Vitest)                                 |
| `pnpm test:db`                 | Aplica las migraciones en PGlite y verifica reglas y RLS |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript                                      |
| `pnpm format`                  | Prettier                                                 |
| `pnpm build`                   | Build de producción                                      |
