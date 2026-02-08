"use client";

import { motion } from "framer-motion";
import type { NotificationSetting } from "../../types";
import { ToggleSwitch } from "../shared";

interface NotificationsSectionProps {
  notifications: NotificationSetting[];
  onToggle: (id: string) => void;
}

export function NotificationsSection({ notifications, onToggle }: NotificationsSectionProps) {
  const categories = [
    { key: "workflow" as const, label: "Workflow Activity" },
    { key: "account" as const, label: "Account & Security" },
    { key: "marketing" as const, label: "Marketing & Updates" },
  ];

  return (
    <motion.div
      key="notifications"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl border border-border/50 bg-white dark:bg-card shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-border/50">
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how and when you want to be notified
        </p>
      </div>

      <div className="divide-y divide-border/50">
        {categories.map((category) => (
          <div key={category.key} className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              {category.label}
            </h3>
            <div className="space-y-3">
              {notifications.filter(n => n.category === category.key).map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{notification.label}</p>
                    <p className="text-xs text-muted-foreground">{notification.description}</p>
                  </div>
                  <ToggleSwitch
                    enabled={notification.enabled}
                    onToggle={() => onToggle(notification.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
