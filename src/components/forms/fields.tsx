"use client"

import { CircleAlert, CircleCheck, Eye, EyeOff, Loader2 } from "lucide-react"
import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FieldProps extends Omit<React.ComponentProps<"input">, "id" | "prefix"> {
  label: string
  errors?: string[]
  /** Texto fijo a la izquierda, por ejemplo "S/" */
  prefix?: string
  /** Ayuda debajo del campo */
  hint?: string
}

/** Campo con etiqueta y errores accesibles. Alto de 44px para dedos. */
export function Field({ label, errors, prefix, hint, className, type, ...props }: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const [visible, setVisible] = useState(false)
  const isPassword = type === "password"
  const hasError = Boolean(errors?.length)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center num text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={cn("h-11 bg-surface px-3 text-base", isPassword && "pr-11", prefix && "pl-11 num", className)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {hasError ? (
        <p id={errorId} className="text-xs text-destructive">
          {errors![0]}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" size="lg" disabled={pending} className="h-11 w-full text-base">
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  )
}

export function FormAlert({ error, message }: { error?: string; message?: string }) {
  if (!error && !message) return null
  const Icon = error ? CircleAlert : CircleCheck

  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "flex gap-2.5 border-l-2 bg-surface px-3 py-2.5 text-sm",
        error ? "border-destructive" : "border-brand-text",
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", error ? "text-destructive" : "text-brand-text")} />
      <p>{error ?? message}</p>
    </div>
  )
}

export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}
