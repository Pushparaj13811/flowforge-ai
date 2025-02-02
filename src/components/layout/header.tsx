"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocalStorageString } from "@/hooks";
import { motion } from "framer-motion";
import { Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, className, actions }: HeaderProps) {
  const [theme, setTheme] = useLocalStorageString("theme", "system");
  const isDark = theme === "dark";

  // Apply theme on mount and when theme changes
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-14 flex items-center justify-between px-4",
        "bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b border-border/50",
        "supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-card/60",
        className
      )}
    >
      {/* Left - Title */}
      <div className="flex items-center gap-3">
        {title && (
          <div>
            <h1 className="font-semibold text-sm leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-1">
        {/* Custom Actions */}
        {actions}

        {actions && <div className="w-px h-5 bg-border mx-1" />}

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-destructive" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8"
          title={isDark ? "Light mode" : "Dark mode"}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDark ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </motion.div>
        </Button>
      </div>
    </header>
  );
}
