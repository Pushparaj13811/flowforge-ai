"use client";

import { motion } from "framer-motion";
import { ExternalLink, Mail, Github, MessageSquare } from "lucide-react";

export function HelpSection() {
  const links = [
    { icon: ExternalLink, label: "Documentation", description: "Learn how to use FlowForge", href: "https://docs.flowforge.ai" },
    { icon: Mail, label: "Contact Support", description: "Get help from our team", href: "mailto:support@flowforge.ai" },
    { icon: Github, label: "GitHub", description: "View source and contribute", href: "https://github.com/flowforge-ai" },
    { icon: MessageSquare, label: "Community", description: "Join our Discord server", href: "https://discord.gg/flowforge" },
  ];

  const shortcuts = [
    { keys: "⌘ + K", action: "Open command palette" },
    { keys: "⌘ + N", action: "New workflow" },
    { keys: "⌘ + S", action: "Save workflow" },
    { keys: "⌘ + Z", action: "Undo" },
    { keys: "⌘ + ⇧ + Z", action: "Redo" },
    { keys: "Delete", action: "Delete selected" },
  ];

  return (
    <motion.div
      key="help"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-border/50 bg-white dark:bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-lg font-semibold">Help & Support</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Get help with FlowForge
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="rounded-2xl border border-border/50 bg-white dark:bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.keys} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-card border text-xs font-mono shadow-sm">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground py-4">
        <p>FlowForge AI v0.1.0</p>
        <p className="mt-1">Made with ❤️ using Tambo AI</p>
      </div>
    </motion.div>
  );
}
