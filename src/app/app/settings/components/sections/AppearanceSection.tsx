"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Monitor, CheckCircle } from "lucide-react";

interface AppearanceSectionProps {
  theme: string;
  onThemeChange: (theme: string) => void;
}

export function AppearanceSection({ theme, onThemeChange }: AppearanceSectionProps) {
  const themeOptions = [
    { id: "light", label: "Light", icon: Sun, preview: "bg-white border-2" },
    { id: "dark", label: "Dark", icon: Moon, preview: "bg-zinc-900" },
    { id: "system", label: "System", icon: Monitor, preview: "bg-gradient-to-r from-white to-zinc-900" },
  ];

  return (
    <motion.div
      key="appearance"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl border border-border/50 bg-white dark:bg-card shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-border/50">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize how FlowForge looks on your device
        </p>
      </div>

      <div className="p-6">
        <h3 className="text-sm font-medium mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.id;
            return (
              <button
                key={option.id}
                onClick={() => onThemeChange(option.id)}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`h-16 rounded-lg mb-3 ${option.preview}`} />
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> System theme automatically switches between light and dark based on your device settings.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
