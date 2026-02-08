"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  src?: string;
  alt?: string;
  fallback?: string;
  status?: "online" | "offline" | "away" | "busy";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const statusClasses = {
  online: "bg-flow-green",
  offline: "bg-muted-foreground",
  away: "bg-flow-orange",
  busy: "bg-destructive",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = "md", src, alt, fallback, status, ...props }, ref) => {
    const [error, setError] = React.useState(false);

    const initials = React.useMemo(() => {
      if (fallback) return fallback.slice(0, 2).toUpperCase();
      if (alt) {
        const parts = alt.split(" ");
        if (parts.length >= 2) {
          return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return alt.slice(0, 2).toUpperCase();
      }
      return "??";
    }, [fallback, alt]);

    return (
      <div className="relative inline-block">
        <div
          ref={ref}
          className={cn(
            "relative flex shrink-0 overflow-hidden rounded-full bg-gradient-flow",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          {src && !error ? (
            <img
              src={src}
              alt={alt}
              className="aspect-square h-full w-full object-cover"
              onError={() => setError(true)}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-medium text-white">
              {initials}
            </span>
          )}
        </div>

        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
              statusClasses[status],
              size === "sm" ? "h-2 w-2" : size === "md" ? "h-2.5 w-2.5" : "h-3 w-3"
            )}
          />
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
