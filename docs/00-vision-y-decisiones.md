# 00 · Visión y decisiones

## Visión

**Bolsillo** es una app para saber en todo momento **cuánto tengo, en qué gasto y cuánto debo**, con un registro tan rápido (menos de 5 segundos) que no dé pereza anotar cada gasto.

## Usuarios

1. **Fase 1:** yo (el autor). Uso iPhone y parto de cero, sin datos previos.
2. **Fase 2:** amigos y familia invitados. Cada uno lleva sus finanzas por separado y puede tener cuentas compartidas con otros.
3. **Fase 3:** público general (posible publicación).

## Decisiones tomadas

| Tema            | Decisión                                                                                                          | Motivo                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Plataforma      | **PWA** (web instalable)                                                                                          | Gratis, se comparte con un link, no necesita Mac                                |
| App nativa      | Más adelante, reutilizando el mismo backend                                                                       | No hay Mac. La cuenta de Apple (USD 99/año) solo tendría sentido al publicar    |
| Registro rápido | **Atajo de iOS** que llama a la API y se pone en el Centro de Control                                             | Funciona sin app nativa (iOS 18+)                                               |
| Monedas         | **PEN y USD**                                                                                                     | Cada cuenta tiene una moneda. Los totales se convierten con el tipo de cambio   |
| Tipos de cuenta | Efectivo, Yape, tarjeta de crédito (y bancos/ahorro a futuro)                                                     | Medios actuales del usuario                                                     |
| Tema            | **Claro y oscuro** (según el sistema, con opción manual)                                                          |                                                                                 |
| Color de acento | **Citrino eléctrico** (el verde-lima de la plantilla de Sleek)                                                    | Preferencia del usuario                                                         |
| Login           | **Google y email/contraseña**                                                                                     |                                                                                 |
| Offline         | **Pospuesto**                                                                                                     | Se retomará cuando haga falta (ver el roadmap)                                  |
| Multiusuario    | Datos separados por usuario y **espacios compartidos**                                                            | Desde el día 1 en el modelo de datos                                            |
| Idioma          | Español (es-PE)                                                                                                   | i18n preparado pero no prioritario                                              |
| Dinero          | Enteros en **céntimos**                                                                                           | Evita errores de punto flotante                                                 |
| Tipo de cambio  | **SUNAT automático** para los totales. En cada cambio de moneda se guarda el **tipo real** que te dieron          | Oficial y sin trabajo manual para los totales, exacto en las operaciones reales |
| "Este mes"      | **Mes calendario** (1 al 30/31) por defecto, configurable con un **día de inicio** (por ejemplo, el día de cobro) | Lo más intuitivo, pero se adapta a quien cobra a mitad de mes                   |
| USD en la UI    | Solo aparece si el usuario tiene al menos una cuenta en USD                                                       | Quien usa solo soles (como el autor) no ve ruido                                |

## Principio: diseñar para el caso general, configurar para el caso propio

El caso del autor (1 tarjeta solo en soles, Yape = cuenta BCP, sin dólares ni ahorros) es **un caso más**. El modelo soporta desde el inicio:

- Varias tarjetas, en soles, en dólares o **bimoneda**.
- Yape/Plin como medio de pago de una cuenta bancaria, **o** una billetera independiente (Yape sin banco).
- Cuentas de ahorro, sueldo o en dólares.

El **onboarding** pregunta qué tiene cada persona y solo crea eso.

## Fuera de alcance (por ahora)

- Conexión automática con bancos (Open Banking no existe de forma accesible en Perú).
- Inversiones y portafolio (la pantalla "Invest" de la plantilla se reemplaza por "Metas").
- Widgets nativos de iOS (requieren Mac y Xcode).

## Preguntas abiertas

Ver la sección "Preguntas pendientes" al final de [04 · Funcionalidades y roadmap](04-funcionalidades-y-roadmap.md).
