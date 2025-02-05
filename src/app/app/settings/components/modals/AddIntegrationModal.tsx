"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { integrationTypes } from "../../constants";

interface AddIntegrationModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onAdd: (type: string, name: string, config: Record<string, string>) => Promise<boolean>;
}

export function AddIntegrationModal({ isOpen, isSaving, onClose, onAdd }: AddIntegrationModalProps) {
  const [type, setType] = React.useState("slack");
  const [name, setName] = React.useState("");
  const [config, setConfig] = React.useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = React.useState<Record<string, boolean>>({});

  const handleSubmit = async () => {
    const success = await onAdd(type, name, config);
    if (success) {
      setName("");
      setConfig({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-border/50">
            <h3 className="text-lg font-semibold">Add Integration</h3>
            <p className="text-sm text-muted-foreground mt-1">Connect a new service to your workflows</p>
          </div>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium mb-3 block">Select Integration Type</label>
              <div className="grid grid-cols-2 gap-2">
                {integrationTypes.slice(0, 6).map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setType(t.id); setConfig({}); }}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        type === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${t.color}`} />
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Integration Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Slack Workspace"
                className="h-11"
              />
            </div>

            {type === "slack" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Bot Token</label>
                <div className="relative">
                  <Input
                    type={showSecrets.slackToken ? "text" : "password"}
                    value={config.botToken || ""}
                    onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                    placeholder="xoxb-..."
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets({ ...showSecrets, slackToken: !showSecrets.slackToken })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSecrets.slackToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Get from Slack App → OAuth & Permissions → Bot User OAuth Token
                </p>
              </div>
            )}

            {type === "email" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Resend API Key</label>
                  <Input
                    type="password"
                    value={config.apiKey || ""}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="re_..."
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">From Email</label>
                  <Input
                    value={config.fromEmail || ""}
                    onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                    placeholder="noreply@yourdomain.com"
                    className="h-11"
                  />
                </div>
              </div>
            )}

            {type === "discord" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Webhook URL</label>
                <Input
                  value={config.webhookUrl || ""}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="h-11"
                />
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border/50 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={isSaving || !name.trim()}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Integration"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
