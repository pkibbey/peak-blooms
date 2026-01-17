import { Badge } from "@/components/ui/badge"
import {
  IconCheckCircle,
  IconClock,
  IconPackage,
  IconShoppingCart,
  IconTruck,
  IconXCircle,
} from "@/components/ui/icons"
import type { OrderStatus } from "@/generated/enums"

const STATUS_CONFIG = {
  CART: { label: "Cart", variant: "secondary" as const, icon: IconShoppingCart },
  PENDING: { label: "Pending", variant: "secondary" as const, icon: IconClock },
  CONFIRMED: { label: "Confirmed", variant: "default" as const, icon: IconCheckCircle },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", variant: "default" as const, icon: IconTruck },
  DELIVERED: { label: "Delivered", variant: "default" as const, icon: IconPackage },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const, icon: IconXCircle },
} as const

interface OrderStatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const StatusIcon = config.icon

  return (
    <Badge variant={config.variant} className={className}>
      <StatusIcon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}
