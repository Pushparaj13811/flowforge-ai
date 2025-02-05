"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "danger";
  icon?: React.ReactNode;
}

export function SettingsModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "default",
  icon,
}: SettingsModalProps) {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                {variant === "danger" ? (
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                ) : icon ? (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {icon}
                  </div>
                ) : null}
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${variant === "danger" ? "text-destructive" : ""}`}>
                    {title}
                  </h3>
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-6">{children}</div>

            {footer && (
              <div className="p-6 border-t border-border/50 flex gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  confirmVariant?: "default" | "destructive";
  isLoading?: boolean;
  requireConfirmText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  confirmVariant = "default",
  isLoading = false,
  requireConfirmText,
}: ConfirmModalProps) {
  const [confirmInput, setConfirmInput] = React.useState("");
  const canConfirm = !requireConfirmText || confirmInput === requireConfirmText;

  React.useEffect(() => {
    if (!isOpen) setConfirmInput("");
  }, [isOpen]);

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={confirmVariant === "destructive" ? "danger" : "default"}
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            className="flex-1"
            onClick={onConfirm}
            disabled={isLoading || !canConfirm}
          >
            {isLoading ? "Loading..." : confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{description}</p>
      {requireConfirmText && (
        <div className="mt-4">
          <label className="text-sm font-medium mb-2 block">
            Type <span className="font-mono text-destructive">{requireConfirmText}</span> to confirm
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={requireConfirmText}
            className="w-full h-11 px-3 rounded-lg border border-input bg-background font-mono"
          />
        </div>
      )}
    </SettingsModal>
  );
}
