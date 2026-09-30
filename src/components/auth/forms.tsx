"use client"

import Link from "next/link"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import type { FormState } from "@/lib/form-state"
import { requestPasswordReset, signIn, signInWithGoogle, signUp, updatePassword } from "@/server/actions/auth"
import { Divider, Field, FormAlert, SubmitButton } from "./fields"

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, undefined)

  return (
    <div className="flex flex-col gap-6">
      <GoogleButton next={next} />
      <Divider>o con tu correo</Divider>
      <form action={action} className="flex flex-col gap-4" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        <FormAlert error={state?.error} />
        <Field
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state?.values?.email}
          errors={state?.fieldErrors?.email}
          required
        />
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          errors={state?.fieldErrors?.password}
          required
        />
        <Link
          href="/recuperar"
          className="-mt-1 self-end text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
        <SubmitButton pending={pending}>Entrar</SubmitButton>
      </form>
    </div>
  )
}

export function SignUpForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, undefined)

  if (state?.message) return <FormAlert message={state.message} />

  return (
    <div className="flex flex-col gap-6">
      <GoogleButton />
      <Divider>o con tu correo</Divider>
      <form action={action} className="flex flex-col gap-4" noValidate>
        <FormAlert error={state?.error} />
        <Field
          label="Nombre"
          name="name"
          autoComplete="given-name"
          defaultValue={state?.values?.name}
          errors={state?.fieldErrors?.name}
          required
        />
        <Field
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state?.values?.email}
          errors={state?.fieldErrors?.email}
          required
        />
        <Field
          label="Contraseña (mínimo 8 caracteres)"
          name="password"
          type="password"
          autoComplete="new-password"
          errors={state?.fieldErrors?.password}
          required
        />
        <SubmitButton pending={pending}>Crear cuenta</SubmitButton>
      </form>
    </div>
  )
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, undefined)

  if (state?.message) return <FormAlert message={state.message} />

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormAlert error={state?.error} />
      <Field
        label="Correo"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        defaultValue={state?.values?.email}
        errors={state?.fieldErrors?.email}
        required
      />
      <SubmitButton pending={pending}>Enviar enlace</SubmitButton>
    </form>
  )
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePassword, undefined)

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormAlert error={state?.error} />
      <Field
        label="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        errors={state?.fieldErrors?.password}
        required
      />
      <Field
        label="Repite la contraseña"
        name="confirm"
        type="password"
        autoComplete="new-password"
        errors={state?.fieldErrors?.confirm}
        required
      />
      <SubmitButton pending={pending}>Guardar contraseña</SubmitButton>
    </form>
  )
}

function GoogleButton({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signInWithGoogle, undefined)

  return (
    <form action={action} className="flex flex-col gap-3">
      {next && <input type="hidden" name="next" value={next} />}
      <Button type="submit" variant="outline" size="lg" disabled={pending} className="h-11 w-full bg-surface text-base">
        <GoogleIcon />
        Continuar con Google
      </Button>
      <FormAlert error={state?.error} />
    </form>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.29v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.87 8.88 4.77 12 4.77Z"
      />
    </svg>
  )
}
