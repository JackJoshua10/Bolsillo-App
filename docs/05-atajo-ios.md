# 05 · Atajo de iOS (registro rápido)

## Objetivo

Registrar un gasto **sin abrir la app** en unos 3 segundos, desde:

- el **Centro de Control** (deslizar desde la esquina superior derecha), en iOS 18+
- la **pantalla de bloqueo** (controles de iOS 18)
- el **botón de Acción** (iPhone 15 Pro o posterior)
- **Siri** ("Oye Siri, gasto Bolsillo")
- un widget de Atajos en la pantalla de inicio

No requiere app nativa, Mac ni cuenta de Apple de pago.

## Flujo

1. El usuario toca el control y aparece el teclado numérico: **"¿Cuánto?"**
2. Aparece un menú con las categorías más usadas: **"¿En qué?"**
3. (Opcional) Menú de cuenta. Por defecto, la cuenta configurada en el token
4. (Opcional) Descripción
5. El Atajo hace un `POST` a la API
6. Notificación: "✅ S/ 12.50 · Comida · Yape"

## API

```http
POST /api/v1/transactions
Authorization: Bearer <token personal>
Content-Type: application/json

{
  "type": "expense",
  "amount": "12.50",
  "category": "Comida",          // por nombre o id
  "account": "BCP",               // opcional, usa el default del token
  "payment_method": "yape",       // opcional
  "description": "Menú",          // opcional
  "occurred_on": "2026-09-25"     // opcional, hoy por defecto (America/Lima)
}
```

Endpoint auxiliar: `GET /api/v1/shortcut/config` devuelve las categorías y cuentas para armar los menús del Atajo dinámicamente. Así, si agregas una categoría, el Atajo la muestra sin editarlo.

## Seguridad

- El token se genera en **Perfil → Atajo de iPhone**, se muestra **una sola vez** y se guarda solo su hash.
- Se puede revocar en cualquier momento. Registra `last_used_at`.
- Tiene rate limit por token.
- Los movimientos creados así quedan con `source = 'shortcut'`.

## Entrega

- Link de iCloud al Atajo ya armado, más una guía con capturas para pegar el token y añadirlo al Centro de Control.
