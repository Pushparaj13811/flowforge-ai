"use client";

import * as React from "react";
import type { Integration, PlatformUsage, PlatformLimits } from "../types";

export function useIntegrations() {
  const [integrations, setIntegrations] = React.useState<Integration[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [platformUsage, setPlatformUsage] = React.useState<PlatformUsage>({});
  const [platformLimits, setPlatformLimits] = React.useState<PlatformLimits>({
    email: 100,
    sms: 0,
    ai: 0,
  });

  const fetchIntegrations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/integrations", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPlatformUsage = React.useCallback(async () => {
    try {
      const response = await fetch("/api/platform-usage", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        if (data.usage) {
          setPlatformUsage({ email: data.usage.email?.count || 0 });
        }
        if (data.limits) {
          setPlatformLimits(data.limits);
        }
      }
    } catch (error) {
      console.error("Failed to fetch platform usage:", error);
    }
  }, []);

  React.useEffect(() => {
    fetchIntegrations();
    fetchPlatformUsage();
  }, [fetchIntegrations, fetchPlatformUsage]);

  const addIntegration = async (
    type: string,
    name: string,
    config: Record<string, string>
  ): Promise<boolean> => {
    if (!name.trim()) return false;
    setIsSaving(true);
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, name, config }),
      });
      if (response.ok) {
        await fetchIntegrations();
        return true;
      }
      const error = await response.json();
      throw new Error(error.message || "Failed to add integration");
    } catch (error) {
      console.error("Failed to add integration:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const updateIntegration = async (
    id: string,
    name: string,
    config: Record<string, string>
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, config }),
      });
      if (response.ok) {
        await fetchIntegrations();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update integration:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const testIntegration = async (id: string): Promise<{ success: boolean; message?: string }> => {
    setTestingId(id);
    try {
      const response = await fetch(`/api/integrations/${id}/test`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      await fetchIntegrations();
      return { success: data.success, message: data.message || data.error };
    } catch (error) {
      console.error("Failed to test integration:", error);
      return { success: false, message: "Failed to test integration" };
    } finally {
      setTestingId(null);
    }
  };

  const deleteIntegration = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setIntegrations((prev) => prev.filter((i) => i.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete integration:", error);
      return false;
    }
  };

  const initiateOAuth = async (providerId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/oauth/${providerId}/authorize`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        return data.authUrl;
      }
      return null;
    } catch (error) {
      console.error("Failed to initiate OAuth:", error);
      return null;
    }
  };

  return {
    integrations,
    isLoading,
    isSaving,
    testingId,
    platformUsage,
    platformLimits,
    addIntegration,
    updateIntegration,
    testIntegration,
    deleteIntegration,
    initiateOAuth,
    refetch: fetchIntegrations,
  };
}
