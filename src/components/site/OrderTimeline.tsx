"use client"

import type { OrderStatus } from "@/components/site/OrderStatusBadge"
import {
  IconCheckCircle,
  IconClock,
  IconPackage,
  IconShoppingCart,
  IconTruck,
} from "@/components/ui/icons"
import { formatDate } from "@/lib/utils"

const TIMELINE_STEPS = [
  { status: "CART" as const, label: "Order Placed", icon: IconShoppingCart },
  { status: "PENDING" as const, label: "Pending Confirmation", icon: IconClock },
  { status: "CONFIRMED" as const, label: "Confirmed", icon: IconCheckCircle },
  { status: "OUT_FOR_DELIVERY" as const, label: "Out for Delivery", icon: IconTruck },
  { status: "DELIVERED" as const, label: "Delivered", icon: IconPackage },
] as const

interface OrderTimelineProps {
  status: OrderStatus
  createdAt: Date
}

export function OrderTimeline({ status, createdAt }: OrderTimelineProps) {
  const currentStepIndex = TIMELINE_STEPS.findIndex((step) => step.status === status)

  return (
    <div className="mb-8">
      {/* Desktop: Horizontal Timeline */}
      <div className="hidden sm:block">
        <div className="relative flex justify-between items-start mb-8">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />

          {/* Completed line overlay */}
          {currentStepIndex > 0 && (
            <div
              className="absolute top-5 left-0 h-0.5 bg-[rgb(112,139,108)] transition-all duration-300"
              style={{
                width: `${(currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100}%`,
              }}
            />
          )}

          {/* Steps */}
          {TIMELINE_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            const StepIcon = step.icon

            return (
              <div key={step.status} className="flex flex-col items-center relative z-10 flex-1">
                {/* Step Circle */}
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-full mb-3 transition-all ${
                    isCompleted || isCurrent
                      ? "bg-[rgb(112,139,108)] text-white"
                      : "bg-white border-2 border-gray-200 text-gray-400"
                  }`}
                >
                  <StepIcon className="h-5 w-5" />
                </div>

                {/* Step Label */}
                <p
                  className={`text-xs sm:text-sm text-center font-medium transition-colors ${
                    isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: Vertical Timeline */}
      <div className="sm:hidden space-y-4">
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex
          const isCurrent = index === currentStepIndex
          const isLast = index === TIMELINE_STEPS.length - 1
          const StepIcon = step.icon

          return (
            <div key={step.status} className="flex gap-4 relative">
              {/* Vertical Line */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-10 w-0.5 h-12 transition-colors ${
                    isCompleted ? "bg-[rgb(112,139,108)]" : "bg-gray-200"
                  }`}
                />
              )}

              {/* Step Circle */}
              <div
                className={`flex items-center justify-center h-9 w-9 rounded-full flex-shrink-0 transition-all relative z-10 ${
                  isCompleted || isCurrent
                    ? "bg-[rgb(112,139,108)] text-white"
                    : "bg-white border-2 border-gray-200 text-gray-400"
                }`}
              >
                <StepIcon className="h-4 w-4" />
              </div>

              {/* Step Content */}
              <div className="flex-1 pt-1">
                <p
                  className={`text-sm font-medium transition-colors ${
                    isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Order Date */}
      <p className="text-sm text-muted-foreground mt-6">Order placed on {formatDate(createdAt)}</p>
    </div>
  )
}
