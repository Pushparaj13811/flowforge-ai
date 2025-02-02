"use client";

/**
 * Integration Selector Component
 * Allows users to select their configured integrations for workflow nodes
 */

import * as React from "react";
import { Link2, ExternalLink, Plus, CheckCircle, XCircle, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Integration {
  id: string;
  type: string;
  name: string;
  isActive: boolean;
  lastUsedAt: string | null;
}

interface IntegrationSelectorProps {
  /** Current selected integration ID */
  value?: string;
  /** Callback when integration is selected */
  onChange: (integrationId: string) => void;
  /** Filter integrations by type (e.g., 'slack', 'email', 'resend') */
  filterType?: string | string[];
  /** Label for the selector */
  label?: string;
  /** Whether this field is required */
  required?: boolean;
}

export function IntegrationSelector({
  value,
  onChange,
  filterType,
  label = "Integration",
  required = false,
}: IntegrationSelectorProps) {
  const [integrations, setIntegrations] = React.useState<Integration[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [wasAutoCorrected, setWasAutoCorrected] = React.useState(false);

  // Fetch integrations on mount
  React.useEffect(() => {
    async function fetchIntegrations() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/integrations");
        if (!response.ok) {
          throw new Error("Failed to fetch integrations");
        }
        const data = await response.json();
        setIntegrations(data.integrations || []);
      } catch (err) {
        console.error("Failed to fetch integrations:", err);
        setError(err instanceof Error ? err.message : "Failed to load integrations");
      } finally {
        setIsLoading(false);
      }
    }

    fetchIntegrations();
  }, []);

  // Filter integrations by type
  const filteredIntegrations = React.useMemo(() => {
    if (!filterType) return integrations;
    const types = Array.isArray(filterType) ? filterType : [filterType];
    return integrations.filter((int) => types.includes(int.type));
  }, [integrations, filterType]);

  // Find selected integration
  const selectedIntegration = filteredIntegrations.find((int) => int.id === value);

  // Auto-fix stale integration reference: if value is set but integration doesn't exist,
  // automatically select the first matching integration of the same type
  const hasStaleReference = value && !selectedIntegration && !isLoading && filteredIntegrations.length > 0;

  React.useEffect(() => {
    if (hasStaleReference) {
      // Auto-select the first available integration of this type
      const firstAvailable = filteredIntegrations[0];
      if (firstAvailable) {
        console.warn(
          `[IntegrationSelector] Stale integration reference detected. ` +
          `Old ID: ${value}, auto-selecting: ${firstAvailable.id} (${firstAvailable.name})`
        );
        onChange(firstAvailable.id);
        setWasAutoCorrected(true);
        // Clear the notification after 5 seconds
        setTimeout(() => setWasAutoCorrected(false), 5000);
      }
    }
  }, [hasStaleReference, filteredIntegrations, value, onChange]);

  // Handle platform email (no integration selected)
  const emailTypes = ["email", "resend", "sendgrid", "smtp"];
  const canUsePlatformEmail = filterType
    ? (Array.isArray(filterType)
        ? filterType.some((t) => emailTypes.includes(t))
        : emailTypes.includes(filterType))
    : false;

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="h-8 rounded-md border border-input bg-muted/50 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Loading integrations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2">
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (filteredIntegrations.length === 0) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <div className="flex items-start gap-2 mb-2">
            <Zap className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">No integrations configured</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {canUsePlatformEmail
                  ? "Platform email will be used (100/month limit)"
                  : "Connect an integration to use this node"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs"
            onClick={() => window.open("/app/settings?section=integrations", "_blank")}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Integration
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
        {canUsePlatformEmail && (
          <p className="text-[10px] text-muted-foreground">
            ✓ This node will work using platform email (no configuration needed)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 px-1 text-[10px] text-primary hover:text-primary"
          onClick={() => window.open("/app/settings?section=integrations", "_blank")}
        >
          <Plus className="h-3 w-3 mr-0.5" />
          Add
        </Button>
      </div>

      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none"
      >
        {canUsePlatformEmail && (
          <option value="">Platform Email (100/month free)</option>
        )}
        {!canUsePlatformEmail && !value && (
          <option value="">Select integration...</option>
        )}
        {filteredIntegrations.map((integration) => (
          <option key={integration.id} value={integration.id}>
            {integration.name} ({integration.type})
            {!integration.isActive ? " - Inactive" : ""}
          </option>
        ))}
      </select>

      {selectedIntegration && (
        <div className="flex items-center gap-1 text-[10px]">
          {selectedIntegration.isActive ? (
            <>
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-green-600 dark:text-green-400">Active</span>
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 text-red-500" />
              <span className="text-red-600 dark:text-red-400">Inactive</span>
            </>
          )}
          {selectedIntegration.lastUsedAt && (
            <span className="text-muted-foreground ml-2">
              • Last used {new Date(selectedIntegration.lastUsedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {wasAutoCorrected && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded text-[10px] text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>Integration was updated automatically (previous one was deleted)</span>
        </div>
      )}

      {canUsePlatformEmail && !value && (
        <p className="text-[10px] text-muted-foreground">
          Using platform email. Add your own integration for unlimited sends.
        </p>
      )}
    </div>
  );
}
