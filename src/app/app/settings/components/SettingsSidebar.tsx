"use client";

import { motion } from "framer-motion";
import {
  User,
  Bell,
  Palette,
  Shield,
  HelpCircle,
  Key,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { SettingsSection } from "../types";

const sections = [
  { id: "profile" as const, label: "Profile", icon: User, description: "Personal information" },
  { id: "integrations" as const, label: "Integrations", icon: Zap, description: "Connected services" },
  { id: "notifications" as const, label: "Notifications", icon: Bell, description: "Email & alerts" },
  { id: "appearance" as const, label: "Appearance", icon: Palette, description: "Theme & display" },
  { id: "security" as const, label: "Security", icon: Shield, description: "Password & sessions" },
  { id: "api-keys" as const, label: "API Keys", icon: Key, description: "Developer access" },
  { id: "help" as const, label: "Help & Support", icon: HelpCircle, description: "Documentation" },
];

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  const { user, isAuthenticated } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="rounded-2xl border border-border/50 bg-white dark:bg-card p-2 shadow-sm">
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? "bg-primary/10" : "bg-muted group-hover:bg-muted"
                }`}>
                  <Icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{section.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{section.description}</p>
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? "text-primary" : "opacity-0 group-hover:opacity-50"}`} />
              </button>
            );
          })}

        </nav>
      </div>

      {/* User Quick Info */}
      {isAuthenticated && user && (
        <div className="mt-4 rounded-2xl border border-border/50 bg-white dark:bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold text-sm">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
