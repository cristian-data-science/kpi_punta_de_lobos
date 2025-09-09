import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "bg-blue-600 text-white",
    secondary: "bg-gray-100 text-gray-800",
    destructive: "bg-red-600 text-white",
    outline: "border border-gray-300 text-gray-700 bg-transparent",
  }

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses[variant] || variantClasses.default,
        className
      )}
      {...props}
    />
  )
})

Badge.displayName = "Badge"

export { Badge }
