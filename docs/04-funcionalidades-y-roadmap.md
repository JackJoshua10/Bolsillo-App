# 04 · Funcionalidades y roadmap

## Fase 0: Cimientos (antes de la primera pantalla)

- [ ] Validar los tokens de color con una captura de la plantilla
- [x] Crear el proyecto Next.js 16 + TS + Tailwind 4 + shadcn + ESLint/Prettier + Vitest
- [ ] Crear los proyectos Supabase (dev y prod) y conectar Vercel
- [x] Migración inicial: perfiles, espacios, cuentas, categorías, movimientos, tipo de cambio y RLS (validada con `pnpm test:db`, falta aplicarla en Supabase)
- [x] Tokens de diseño (claro/oscuro) y componentes base (vista previa en `/`)
- [x] Manifest PWA e íconos generados
- [ ] Splash screens de iOS

## Fase 1: MVP personal 🎯

**Objetivo:** usarla a diario en mi iPhone durante 2–4 semanas.

- [~] **Auth:** registro/login con Google y email, recuperar contraseña (código listo; falta configurar Supabase, ver [06](06-configurar-supabase.md))
- [x] **Onboarding guiado** (`/bienvenida`: efectivo, banco con Yape/Plin, tarjeta PEN o USD; ahorros/dólares/más tarjetas irán en "Cuentas"): "¿Qué usas?" → efectivo, cuenta bancaria (con Yape/Plin), tarjeta(s) de crédito (PEN / USD / bimoneda), ahorros, dólares. Solo crea lo elegido, con su saldo inicial. _(Caso del autor: Efectivo + BCP·Yape + Tarjeta en soles)_
- [~] Día de inicio de mes configurable (por defecto el 1): la lógica ya existe (`monthRange`), falta el ajuste en Perfil
- [~] **Agregar movimiento** (gasto e ingreso listos con el botón +; falta transferencia): gasto, ingreso o transferencia (incluye pagar tarjeta y cambiar dólares). Meta: menos de 5 segundos
- [~] **Inicio** (datos reales: patrimonio, gasto e ingresos del mes, cuentas, últimos movimientos; falta el sparkline): patrimonio neto en PEN, gasto del mes, saldos por cuenta, deuda de tarjeta y sparkline de 30 días
- [ ] **Movimientos:** lista por día, filtros (cuenta, categoría, tipo, rango), búsqueda, editar, borrar y deshacer
- [ ] **Cuentas:** CRUD. La tarjeta muestra límite, disponible, fecha de corte y fecha de pago
- [ ] **Categorías:** CRUD con ícono y color
- [ ] **Análisis:** donut por categoría del mes y barras de los últimos 6 meses
- [ ] **Tipo de cambio:** obtener el diario automáticamente, con edición manual
- [ ] **Perfil:** tema claro/oscuro/sistema, moneda base y modo privado (ocultar montos)
- [ ] **API `/api/v1/transactions`** y generación de token
- [ ] **Atajo de iOS** en el Centro de Control (ver [05](05-atajo-ios.md))
- [ ] Exportar movimientos a CSV (respaldo)

## Fase 2: Compartir y hábitos

- [ ] **Espacios compartidos:** crear, invitar por email/link, roles, ver "quién registró qué"
- [ ] **Presupuestos** mensuales por categoría con alertas visuales
- [ ] **Movimientos recurrentes** (alquiler, Netflix, sueldo)
- [ ] **Metas de ahorro**
- [ ] Recordatorio de pago de tarjeta (notificaciones push de la PWA, iOS 16.4+ instalada)
- [ ] Adjuntar foto del voucher (Supabase Storage)
- [ ] **SMTP propio** (Resend) + plantillas de correo en español (ver [06](06-configurar-supabase.md))
- [ ] Sentry y analítica básica
- [ ] 🔔 **Revisar si hace falta el modo offline** (ver abajo)

## Fase 3: Crecer y publicar

- [ ] Dividir gastos entre miembros ("yo pagué, me debes S/ 30") con saldos entre personas
- [ ] Importar estados de cuenta (CSV/Excel del banco)
- [ ] Préstamos y deudas personales
- [ ] Landing page, términos y política de privacidad
- [ ] Evaluar una app nativa con **Expo (React Native)** usando la misma API. Se compila en la nube con EAS, **sin Mac**. Habilita widgets y la publicación en App Store (requiere la cuenta de Apple de USD 99/año)

## 🔔 Cuándo retomar el tema offline

Lo retomaremos (y te avisaré) en cuanto pase cualquiera de estas cosas:

1. Al terminar la fase 1, **según tu uso real**: si notas que quieres anotar gastos sin señal (metro, ascensor, viaje).
2. Antes de invitar a otras personas (fase 2), porque ellas pueden tener peor conexión.
3. Si decidimos hacer la app nativa, porque ahí se diseña de otra forma.

Mientras tanto, la app hará **actualizaciones optimistas** (el gasto aparece al instante) y mostrará un error claro si no hay conexión.

## Preguntas resueltas (2026-09-25)

| Pregunta       | Caso del autor   | Decisión general                                              |
| -------------- | ---------------- | ------------------------------------------------------------- |
| Tarjeta        | 1, solo en soles | N tarjetas, en PEN, USD o bimoneda                            |
| Yape           | Es la cuenta BCP | Cuenta bancaria + `payment_method`, o billetera independiente |
| Ahorros        | No tiene         | Tipo `savings` disponible                                     |
| Dólares        | No tiene         | La UI de USD se oculta si no hay cuentas en USD               |
| Tipo de cambio | —                | SUNAT automático + el tipo real en cada operación de cambio   |
| Mes            | —                | Calendario por defecto, con día de inicio configurable        |
