"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Copy, Check, AlertTriangle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiKey } from "../../types";

interface CreateApiKeyModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<ApiKey | null>;
}

export function CreateApiKeyModal({ isOpen, isSaving, onClose, onCreate }: CreateApiKeyModalProps) {
  const [name, setName] = React.useState("");
  const [createdKey, setCreatedKey] = React.useState<ApiKey | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleCreate = async () => {
    const key = await onCreate(name);
    if (key) {
      setCreatedKey(key);
    }
  };

  const handleCopy = async () => {
    if (createdKey?.fullKey) {
      await navigator.clipboard.writeText(createdKey.fullKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName("");
    setCreatedKey(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {createdKey ? (
            // Success View - Show the created key
            <>
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Key className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">API Key Created</h3>
                    <p className="text-sm text-muted-foreground">
                      {createdKey.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Warning */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Save this key now!</p>
                    <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                      You won't be able to see it again after closing this dialog.
                    </p>
                  </div>
                </div>

                {/* API Key Display */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Your API Key</label>
                  <div className="relative">
                    <code className="block w-full p-3 pr-12 bg-muted rounded-lg font-mono text-sm break-all">
                      {createdKey.fullKey}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Usage Example */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Usage</label>
                  <code className="block w-full p-3 bg-muted rounded-lg font-mono text-xs text-muted-foreground">
                    curl -X POST /api/webhooks/trigger/TOKEN \<br />
                    &nbsp;&nbsp;-H "Authorization: Bearer {createdKey.keyPrefix}..."
                  </code>
                </div>
              </div>

              <div className="p-6 border-t border-border/50">
                <Button className="w-full" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </>
          ) : (
            // Create Form View
            <>
              <div className="p-6 border-b border-border/50">
                <h3 className="text-lg font-semibold">Create API Key</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  API keys allow you to trigger workflows programmatically
                </p>
              </div>

              <div className="p-6">
                <label className="text-sm font-medium mb-2 block">Key Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Production Server"
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Give your key a descriptive name so you can identify it later
                </p>
              </div>

              <div className="p-6 border-t border-border/50 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCreate} disabled={isSaving || !name.trim()}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Key"}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
