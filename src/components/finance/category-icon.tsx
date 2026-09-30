import {
  Briefcase,
  Bus,
  Ellipsis,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Laptop,
  Plug,
  Popcorn,
  Repeat,
  Shirt,
  ShoppingCart,
  Tag,
  Undo2,
  Utensils,
  type LucideIcon,
  type LucideProps,
} from "lucide-react"

// Nombres guardados en categories.icon (ver seed_default_categories en la migración inicial)
const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  "shopping-cart": ShoppingCart,
  bus: Bus,
  house: House,
  plug: Plug,
  "heart-pulse": HeartPulse,
  popcorn: Popcorn,
  repeat: Repeat,
  shirt: Shirt,
  "graduation-cap": GraduationCap,
  gift: Gift,
  ellipsis: Ellipsis,
  briefcase: Briefcase,
  laptop: Laptop,
  "undo-2": Undo2,
}

export function CategoryIcon({ icon, ...props }: { icon: string | null } & Omit<LucideProps, "ref">) {
  const Icon = (icon && ICONS[icon]) || Tag
  return <Icon strokeWidth={1.75} {...props} />
}
