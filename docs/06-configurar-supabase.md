# 06 · Configurar Supabase

Guía paso a paso para dejar funcionando la base de datos y el login. Se hace una vez por proyecto (`bolsillo-dev` y, más adelante, `bolsillo-prod`).

## 1. Crear el proyecto

1. En **supabase.com**, inicia sesión con GitHub y elige el plan **Free**.
2. Crea el proyecto con **Name** `bolsillo-dev` y **Region** _South America (São Paulo)_.
3. En **Database password**, usa _Generate_ y guárdala en tu gestor de contraseñas.

## 2. Variables de entorno

1. Copia `.env.example` como `.env.local`, en la raíz del proyecto.
2. Completa los valores desde **Project Settings → API Keys**:
   - `NEXT_PUBLIC_SUPABASE_URL`: la _Project URL_
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: la _Publishable key_ (`sb_publishable_…`)

> `.env.local` no se sube a GitHub. La **Secret key** (`sb_secret_…`) nunca va en variables `NEXT_PUBLIC_`.

## 3. Crear las tablas

1. Abre **SQL Editor** y crea una **New query**.
2. Pega todo el contenido de `supabase/migrations/20260925000000_init.sql` y pulsa **Run**. Debe responder _Success. No rows returned_.
3. Revisa en **Table Editor** que existan `profiles`, `spaces`, `accounts`, `categories`, `transactions`, etc.

> Más adelante usaremos la CLI de Supabase (`supabase db push`) para aplicar migraciones automáticamente.

## 4. URLs de autenticación

En **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` (en producción será el dominio de Vercel)
- **Redirect URLs:** agrega
  - `http://localhost:3000/**`
  - `https://*-jackjoshua10s-projects.vercel.app/**` (previews de Vercel; ajusta el nombre cuando exista)

Supabase solo redirige a URLs de esta lista. Eso impide que alguien use los correos para mandar gente a otro sitio.

## 5. Plantillas de correo (en español)

En **Authentication → Emails → Templates**:

**Confirm signup**

- Asunto: `Confirma tu cuenta de Bolsillo`
- Cuerpo:
  ```html
  <h2>¡Bienvenido a Bolsillo!</h2>
  <p>Toca el botón para activar tu cuenta:</p>
  <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/">Activar mi cuenta</a></p>
  <p>Si no creaste una cuenta, ignora este correo.</p>
  ```

**Reset password**

- Asunto: `Crea una nueva contraseña de Bolsillo`
- Cuerpo:

<!-- prettier-ignore -->
```html
<h2>Recupera tu contraseña</h2>
<p>Toca el botón para crear una nueva contraseña:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/nueva-contrasena">Crear nueva contraseña</a></p>
<p>Si no lo pediste, ignora este correo. Tu contraseña no cambiará.</p>
```

> Estos enlaces usan `token_hash`, así que funcionan aunque el correo se abra en otro navegador o en el iPhone.

**Límite del plan Free:** Supabase envía pocos correos por hora con su servidor de prueba. Para uso real (fase 2) configuraremos un SMTP propio (por ejemplo, Resend) en **Authentication → Emails → SMTP Settings**.

## 6. Login con Google (opcional, se puede hacer después)

1. En **Google Cloud Console**, crea un proyecto `Bolsillo`.
2. Configura la **pantalla de consentimiento de OAuth** en modo _External_ y agrega tu correo como usuario de prueba.
3. Ve a **Credentials → Create credentials → OAuth client ID** y crea uno de tipo _Web application_:
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** `https://<tu-proyecto>.supabase.co/auth/v1/callback`
4. Copia el _Client ID_ y el _Client secret_ en Supabase → **Authentication → Sign In / Providers → Google** y actívalo.

Mientras Google no esté activado, el botón "Continuar con Google" muestra: _"Ese método de inicio de sesión aún no está habilitado."_

## 7. Probar

```bash
pnpm dev
```

1. Abre http://localhost:3000. Te lleva a `/login`.
2. En **Crea tu cuenta**, regístrate y abre el correo para activar la cuenta.
3. Deberías llegar al Inicio con tu nombre ("Hola, …").
4. En Supabase → **Table Editor → profiles** debe aparecer tu perfil, y en `spaces` tu espacio **Personal**.
