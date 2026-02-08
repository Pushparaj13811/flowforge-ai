"use client";

import * as React from "react";
import { useFlowStore } from "../../store";
import { useCopyToClipboard } from "@/hooks";
import type { TriggerData } from "../types";

export function useWebhookTrigger(
  config: Record<string, unknown>,
  onChange: (config: Record<string, unknown>) => void
) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [triggerData, setTriggerData] = React.useState<TriggerData | null>(null);
  const { copyToClipboard } = useCopyToClipboard();

  const selectedNode = useFlowStore((state) =>
    state.nodes.find((n) => n.id === state.selectedNodeId)
  );

  const workflowId = React.useMemo(() => {
    if (typeof window !== "undefined") {
      const pathParts = window.location.pathname.split("/");
      return pathParts[pathParts.length - 1];
    }
    return null;
  }, []);

  // Fetch existing webhook on mount
  React.useEffect(() => {
    if (!workflowId || !selectedNode) return;

    const nodeId = selectedNode.id;

    async function fetchWebhook() {
      try {
        const response = await fetch(`/api/workflows/${workflowId}/triggers`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const trigger = data.triggers.find(
            (t: { nodeId: string }) => t.nodeId === nodeId
          );
          if (trigger) {
            setTriggerData({
              webhookUrl: trigger.webhookUrl,
              webhookToken: trigger.webhookToken,
              bearerToken: trigger.bearerToken,
              hmacSecret: trigger.hmacSecret,
              authMethod: trigger.authMethod || "url_token",
            });
            onChange({
              ...config,
              webhookUrl: trigger.webhookUrl,
              authMethod: trigger.authMethod || "url_token",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch webhook:", error);
      }
    }

    fetchWebhook();
  }, [workflowId, selectedNode?.id]);

  const handleGenerateWebhook = async () => {
    if (!workflowId || !selectedNode) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/triggers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nodeId: selectedNode.id,
          triggerType: "webhook",
          config: {},
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate webhook");
      }

      const data = await response.json();
      setTriggerData({
        webhookUrl: data.trigger.webhookUrl,
        webhookToken: data.trigger.webhookToken,
        bearerToken: data.trigger.bearerToken,
        hmacSecret: data.trigger.hmacSecret,
        authMethod: data.trigger.authMethod || "url_token",
      });
      onChange({
        ...config,
        webhookUrl: data.trigger.webhookUrl,
        authMethod: data.trigger.authMethod || "url_token",
      });
    } catch (error) {
      console.error("Failed to generate webhook:", error);
      alert("Failed to generate webhook URL. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAuthMethodChange = async (newMethod: string) => {
    if (!workflowId || !selectedNode) return;

    onChange({ ...config, authMethod: newMethod });

    try {
      await fetch(`/api/workflows/${workflowId}/triggers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nodeId: selectedNode.id,
          authMethod: newMethod,
        }),
      });
    } catch (error) {
      console.error("Failed to update auth method:", error);
    }
  };

  const handleCopyWebhook = async () => {
    if (triggerData?.webhookUrl) {
      const success = await copyToClipboard(triggerData.webhookUrl, "webhook-url");
      if (success) {
        alert("Webhook URL copied to clipboard!");
      }
    }
  };

  const getAuthToken = () => {
    if (!triggerData) return null;
    const authMethod = (config.authMethod as string) || "url_token";
    switch (authMethod) {
      case "bearer":
        return triggerData.bearerToken;
      case "hmac":
        return triggerData.hmacSecret;
      default:
        return triggerData.webhookToken;
    }
  };

  const handleCopyToken = async () => {
    const currentToken = getAuthToken();
    if (currentToken) {
      const success = await copyToClipboard(currentToken, "auth-token");
      if (success) {
        alert("Token copied to clipboard!");
      }
    }
  };

  return {
    isGenerating,
    triggerData,
    handleGenerateWebhook,
    handleAuthMethodChange,
    handleCopyWebhook,
    handleCopyToken,
    getAuthToken,
  };
}
