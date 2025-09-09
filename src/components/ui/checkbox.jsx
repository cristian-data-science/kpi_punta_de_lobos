import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, checked, disabled, onChange, ...props }, ref) => (
  <div
    className={cn(
      "flex h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      checked && "bg-blue-600 border-blue-600 text-white",
      disabled && "cursor-not-allowed opacity-50",
      className
    )}
    ref={ref}
    onClick={() => !disabled && onChange && onChange(!checked)}
    {...props}
  >
    {checked && (
      <Check className="h-3 w-3 text-white" />
    )}
  </div>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
