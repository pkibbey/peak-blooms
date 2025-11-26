import React from "react"
import { ShoppingCart, ShoppingBag, Menu, X, Info, Mail, Flower, ArrowRight, Instagram, Facebook, Rose, Phone, Settings, Plus, Trash2, Minus } from "lucide-react"

// Small re-exports used across the UI so we have a single place to tweak sizing & classes
export const IconSizeClass = "h-4 w-4"

export function IconShoppingCart(props: React.ComponentProps<typeof ShoppingCart>) {
  return <ShoppingCart {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconShoppingBag(props: React.ComponentProps<typeof ShoppingBag>) {
  return <ShoppingBag {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconMenu(props: React.ComponentProps<typeof Menu>) {
  return <Menu {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconX(props: React.ComponentProps<typeof X>) {
  return <X {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconInfo(props: React.ComponentProps<typeof Info>) {
  return <Info {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconMail(props: React.ComponentProps<typeof Mail>) {
  return <Mail {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconFlower(props: React.ComponentProps<typeof Flower>) {
  return <Flower {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconArrowRight(props: React.ComponentProps<typeof ArrowRight>) {
  return <ArrowRight {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconInstagram(props: React.ComponentProps<typeof Instagram>) {
  return <Instagram {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconFacebook(props: React.ComponentProps<typeof Facebook>) {
  return <Facebook {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconRose(props: React.ComponentProps<typeof Rose>) {
  return <Rose {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconPhone(props: React.ComponentProps<typeof Phone>) {
  return <Phone {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconSettings(props: React.ComponentProps<typeof Settings>) {
  return <Settings {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconPlus(props: React.ComponentProps<typeof Plus>) {
  return <Plus {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconMinus(props: React.ComponentProps<typeof Minus>) {
  return <Minus {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconTrash(props: React.ComponentProps<typeof Trash2>) {
  return <Trash2 {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

// intentionally no default export — use named icon exports
