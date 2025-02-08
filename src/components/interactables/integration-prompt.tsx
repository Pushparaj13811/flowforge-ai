"use client";

import { withInteractable } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Schema for an integration option
 */
const integrationOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/**
 * Schema for a required integration
 */
const requiredIntegrationSchema = z.object({
  type: z.string().describe("Integration type (e.g., 'slack', 'google-sheets')"),
  label: z.string().describe("Human-readable label"),
  description: z.string().optional().describe("Description of why this integration is needed"),
  isConnected: z.boolean().default(false).describe("Whether this integration is already connected"),
  options: z.array(integrationOptionSchema).optional().describe("Available accounts if multiple connected"),
  selectedId: z.string().optional().describe("Selected integration ID if multiple options"),
  hasPlatformFallback: z.boolean().optional().describe("Whether platform fallback is available"),
});

/**
 * Schema for IntegrationPrompt props
 */
export const integrationPromptSchema = z.object({
  title: z.string().default("Required Integrations").describe("Title of the prompt"),
  description: z.string().optional().describe("Description explaining what's needed"),
  integrations: z.array(requiredIntegrationSchema).default([]).describe("List of required integrations"),
  onConnect: z.function().args(z.string()).returns(z.void()).optional().describe("Callback when connect is clicked"),
  onSelect: z.function().args(z.string(), z.string()).returns(z.void()).optional().describe("Callback when an account is selected"),
  showRefresh: z.boolean().default(true).describe("Whether to show refresh button"),
  workflowContext: z.string().optional().describe("Context about what workflow needs these integrations"),
});

type IntegrationPromptProps = z.infer<typeof integrationPromptSchema>;
type RequiredIntegration = z.infer<typeof requiredIntegrationSchema>;

/**
 * Get icon and color for integration type
 */
function getIntegrationStyle(type: string): { icon: string; color: string; bgColor: string } {
  const styles: Record<string, { icon: string; color: string; bgColor: string }> = {
    slack: {
      icon: "💬",
      color: "text-[#4A154B]",
      bgColor: "bg-[#4A154B]/10",
    },
    "google-sheets": {
      icon: "📊",
      color: "text-[#0F9D58]",
      bgColor: "bg-[#0F9D58]/10",
    },
    stripe: {
      icon: "💳",
      color: "text-[#635BFF]",
      bgColor: "bg-[#635BFF]/10",
    },
    twilio: {
      icon: "📱",
      color: "text-[#F22F46]",
      bgColor: "bg-[#F22F46]/10",
    },
    discord: {
      icon: "🎮",
      color: "text-[#5865F2]",
      bgColor: "bg-[#5865F2]/10",
    },
    openai: {
      icon: "🤖",
      color: "text-[#10A37F]",
      bgColor: "bg-[#10A37F]/10",
    },
    anthropic: {
      icon: "🧠",
      color: "text-[#C4A484]",
      bgColor: "bg-[#C4A484]/10",
    },
    email: {
      icon: "✉️",
      color: "text-flow-blue",
      bgColor: "bg-flow-blue/10",
    },
    resend: {
      icon: "✉️",
      color: "text-flow-blue",
      bgColor: "bg-flow-blue/10",
    },
  };

  return styles[type] || {
    icon: "🔗",
    color: "text-flow-purple",
    bgColor: "bg-flow-purple/10",
  };
}

/**
 * Base IntegrationPrompt component
 */
function IntegrationPromptBase(props: IntegrationPromptProps) {
  const [config, setConfig] = useState<IntegrationPromptProps>(props);
  const [updatedIntegrations, setUpdatedIntegrations] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevPropsRef = useRef<IntegrationPromptProps>(props);

  // Update state when props change (AI updates)
  useEffect(() => {
    const prevProps = prevPropsRef.current;
    const changedIntegrations = new Set<string>();

    // Check which integrations changed
    const currentIntegrations = config.integrations || [];
    const newIntegrations = props.integrations || [];

    newIntegrations.forEach((integration, index) => {
      const prevIntegration = currentIntegrations[index];
      if (!prevIntegration ||
          integration.isConnected !== prevIntegration.isConnected ||
          integration.selectedId !== prevIntegration.selectedId) {
        changedIntegrations.add(integration.type);
      }
    });

    if (changedIntegrations.size > 0 ||
        props.title !== prevProps.title ||
        props.description !== prevProps.description) {
      setConfig(props);
      setUpdatedIntegrations(changedIntegrations);
      prevPropsRef.current = props;

      // Clear highlights after animation
      const timer = setTimeout(() => {
        setUpdatedIntegrations(new Set());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [props, config.integrations]);

  const handleConnect = (type: string) => {
    // Open settings in a new tab or trigger navigation
    if (typeof window !== 'undefined') {
      window.open('/app/settings/integrations', '_blank');
    }
    config.onConnect?.(type);
  };

  const handleSelect = (type: string, id: string) => {
    setConfig((prev) => ({
      ...prev,
      integrations: prev.integrations.map((i) =>
        i.type === type ? { ...i, selectedId: id } : i
      ),
    }));
    config.onSelect?.(type, id);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger a re-fetch of integrations
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('refresh-integrations');
      window.dispatchEvent(event);
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const allConnected = config.integrations.every((i) => i.isConnected || i.hasPlatformFallback);
  const connectedCount = config.integrations.filter((i) => i.isConnected || i.hasPlatformFallback).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass border border-glass-border rounded-xl p-6 max-w-2xl shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center border",
          allConnected
            ? "bg-flow-green/10 border-flow-green/20"
            : "bg-flow-orange/10 border-flow-orange/20"
        )}>
          {allConnected ? (
            <CheckCircle2 className="h-5 w-5 text-flow-green" />
          ) : (
            <Link2 className="h-5 w-5 text-flow-orange" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
          {config.description && (
            <p className="text-xs text-muted-foreground">{config.description}</p>
          )}
        </div>
        {config.showRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isRefreshing && "animate-spin")} />
          </button>
        )}
      </div>

      {/* Workflow Context */}
      {config.workflowContext && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground">
            <Sparkles className="inline h-3 w-3 mr-1" />
            {config.workflowContext}
          </p>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{connectedCount} of {config.integrations.length} connected</span>
          <span>{Math.round((connectedCount / config.integrations.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(connectedCount / config.integrations.length) * 100}%` }}
            className={cn(
              "h-full rounded-full transition-all duration-500",
              allConnected ? "bg-flow-green" : "bg-flow-blue"
            )}
          />
        </div>
      </div>

      {/* Integration List */}
      <div className="space-y-3">
        <AnimatePresence>
          {config.integrations.map((integration, index) => {
            const style = getIntegrationStyle(integration.type);
            const isUpdated = updatedIntegrations.has(integration.type);
            const hasMultiple = (integration.options?.length || 0) > 1;

            return (
              <motion.div
                key={integration.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-lg border transition-all duration-200",
                  isUpdated && "ring-2 ring-flow-green animate-pulse",
                  integration.isConnected
                    ? "bg-flow-green/5 border-flow-green/30"
                    : integration.hasPlatformFallback
                      ? "bg-flow-blue/5 border-flow-blue/30"
                      : "bg-muted/50 border-border hover:border-flow-purple/50"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-lg", style.bgColor)}>
                    {style.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-foreground">{integration.label}</h4>
                      {integration.isConnected && (
                        <CheckCircle2 className="h-4 w-4 text-flow-green shrink-0" />
                      )}
                      {integration.hasPlatformFallback && !integration.isConnected && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-flow-blue/10 text-flow-blue">
                          Platform default
                        </span>
                      )}
                    </div>
                    {integration.description && (
                      <p className="text-xs text-muted-foreground truncate">{integration.description}</p>
                    )}
                  </div>

                  {/* Action */}
                  {!integration.isConnected && !integration.hasPlatformFallback ? (
                    <button
                      onClick={() => handleConnect(integration.type)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                        "bg-flow-purple text-white hover:bg-flow-purple/90",
                        "transition-colors"
                      )}
                    >
                      Connect
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  ) : hasMultiple ? (
                    <select
                      value={integration.selectedId || ""}
                      onChange={(e) => handleSelect(integration.type, e.target.value)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-flow-purple/50"
                    >
                      <option value="">Select account...</option>
                      {integration.options?.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      Ready
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {allConnected ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-flow-green" />
                <span>All integrations ready</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 text-flow-orange" />
                <span>Some integrations need setup</span>
              </>
            )}
          </div>
          <a
            href="/app/settings/integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            Manage integrations
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Wrapped interactable component
 */
export const IntegrationPrompt = withInteractable(IntegrationPromptBase, {
  componentName: "IntegrationPrompt",
  description: `Interactive component for showing required integrations and their connection status.

Use this when:
- A workflow requires integrations that aren't connected
- The user has multiple accounts of the same type and needs to select one
- Guiding users through integration setup before creating a workflow

Features:
- Shows connection status for each integration
- Connect buttons open settings page
- Dropdown for multi-account selection
- Progress bar showing how many are connected
- Platform fallback indicators for services like email
- Refresh button to check for newly connected integrations`,
  propsSchema: integrationPromptSchema,
});
