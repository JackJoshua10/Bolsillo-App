"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface FormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Solo para lectores de pantalla */
  description: string
  children: React.ReactNode
}

/** Hoja inferior para formularios (registrar, editar). El contenido se monta al abrir. */
export function FormSheet({ open, onOpenChange, title, description, children }: FormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92dvh] max-w-md gap-0 overflow-y-auto rounded-t-2xl border-line bg-background pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-none"
      >
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription className="sr-only">{description}</SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
