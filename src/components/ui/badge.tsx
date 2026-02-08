"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-white shadow",
        outline:
          "border-border text-foreground",
        success:
          "border-transparent bg-flow-green/10 text-flow-green",
        warning:
          "border-transparent bg-flow-orange/10 text-flow-orange",
        info:
          "border-transparent bg-flow-blue/10 text-flow-blue",
        purple:
          "border-transparent bg-flow-purple/10 text-flow-purple",
        gradient:
          "border-transparent bg-gradient-flow text-white",
        glow:
          "border-transparent bg-primary text-primary-foreground glow-blue",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

function Badge({ className, variant, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "mr-1.5 h-2 w-2 rounded-full bg-current",
            pulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
