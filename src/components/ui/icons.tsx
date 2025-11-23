import React from "react"
import { ShoppingCart, ShoppingBag, Home, Menu, X, Info, Mail } from "lucide-react"

// Small re-exports used across the UI so we have a single place to tweak sizing & classes
export const IconSizeClass = "h-4 w-4"

export function IconShoppingCart(props: React.ComponentProps<typeof ShoppingCart>) {
  return <ShoppingCart {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconShoppingBag(props: React.ComponentProps<typeof ShoppingBag>) {
  return <ShoppingBag {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
}

export function IconHome(props: React.ComponentProps<typeof Home>) {
  return <Home {...props} className={[IconSizeClass, props.className].filter(Boolean).join(" ")} />
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

export default null
