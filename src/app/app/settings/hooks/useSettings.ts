"use client";

import * as React from "react";
import type { Session, NotificationSetting, ApiKey, SettingsSection } from "../types";
import { defaultNotifications } from "../constants";

export function useSettings(isAuthenticated: boolean, activeSection: SettingsSection) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const saveSuccessTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Notification settings state
  const [notifications, setNotifications] = React.useState<NotificationSetting[]>(defaultNotifications);

  // Security state
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);

  React.useEffect(() => {
    if (isAuthenticated && activeSection === "security") {
      fetchSessions();
    }
    if (isAuthenticated && activeSection === "api-keys") {
      fetchApiKeys();
    }
  }, [isAuthenticated, activeSection]);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch("/api/auth/sessions", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        console.error("Failed to fetch sessions: API returned", response.status);
        setSessions([]);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/api-keys", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    }
  };

  const handleNotificationToggle = async (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n);
    setNotifications(updated);
    try {
      await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notifications: updated }),
      });
    } catch (error) {
      console.error("Failed to update notification settings:", error);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await fetch(`/api/auth/sessions/${sessionId}`, { method: "DELETE", credentials: "include" });
      fetchSessions();
    } catch (error) {
      console.error("Failed to revoke session:", error);
    }
  };

  const handleCreateApiKey = async (name: string): Promise<ApiKey | null> => {
    if (!name.trim()) return null;
    setIsSaving(true);
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeys((prev) => [...prev, data.key]);
        return data.key;
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
    } finally {
      setIsSaving(false);
    }
    return null;
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm("Are you sure? This key will stop working immediately.")) return;
    try {
      await fetch(`/api/api-keys/${keyId}`, { method: "DELETE", credentials: "include" });
      setApiKeys((prev) => prev.filter(k => k.id !== keyId));
    } catch (error) {
      console.error("Failed to delete API key:", error);
    }
  };

  const showSaveSuccess = React.useCallback(() => {
    if (saveSuccessTimeoutRef.current) {
      clearTimeout(saveSuccessTimeoutRef.current);
    }
    setSaveSuccess(true);
    saveSuccessTimeoutRef.current = setTimeout(() => setSaveSuccess(false), 3000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (saveSuccessTimeoutRef.current) {
        clearTimeout(saveSuccessTimeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    setIsSaving,
    saveSuccess,
    showSaveSuccess,
    notifications,
    sessions,
    isLoadingSessions,
    apiKeys,
    fetchSessions,
    handleNotificationToggle,
    handleRevokeSession,
    handleCreateApiKey,
    handleDeleteApiKey,
  };
}
