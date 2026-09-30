"use client"

import { cn } from "@/lib/utils"

interface SegmentedProps<T extends string> {
  name: string
  options: readonly { value: T; label: string }[]
  value?: T
  defaultValue?: T
  onChange?: (value: T) => void
  label?: string
  className?: string
}

/** Radios con aspecto de control segmentado. Funciona controlado o no controlado. */
export function Segmented<T extends string>({
  name,
  options,
  value,
  defaultValue,
  onChange,
  label,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex rounded-lg border border-line bg-surface p-0.5", className)}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className="relative flex h-9 flex-1 cursor-pointer items-center justify-center rounded-md text-sm text-muted-foreground transition-colors has-checked:bg-surface-2 has-checked:text-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring/50"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            className="sr-only"
            {...(value !== undefined
              ? { checked: value === option.value, onChange: () => onChange?.(option.value) }
              : { defaultChecked: defaultValue === option.value, onChange: () => onChange?.(option.value) })}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
