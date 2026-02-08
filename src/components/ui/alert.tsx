import * as React from "react"
import { cn } from "@/lib/utils"

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "destructive" | "success" | "warning"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-background text-foreground border-border",
    destructive: "bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400 border-red-200 dark:border-red-900",
    success: "bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-400 border-green-200 dark:border-green-900",
    warning: "bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  }

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
