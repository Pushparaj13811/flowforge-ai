"use client";

import { motion } from "framer-motion";
import { Shield, Monitor, Clock, LogOut, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import type { Session } from "../../types";
import { AuthRequired } from "../shared";

interface SecuritySectionProps {
  sessions: Session[];
  isLoading: boolean;
  onPasswordChange: () => void;
  onRevokeSession: (id: string) => void;
  onDeleteAccount: () => void;
  onRefreshSessions: () => void;
}

export function SecuritySection({
  sessions,
  isLoading,
  onPasswordChange,
  onRevokeSession,
  onDeleteAccount,
  onRefreshSessions,
}: SecuritySectionProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <motion.div
        key="security"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-2xl border border-border/50 bg-white dark:bg-card shadow-sm"
      >
        <AuthRequired icon={Shield} message="Sign in to manage security settings" />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="security"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Password Section */}
      <div className="rounded-2xl border border-border/50 bg-white dark:bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-lg font-semibold">Password</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Keep your account secure with a strong password
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Change your password</p>
              <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
            </div>
            <Button onClick={onPasswordChange}>
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-2xl border border-border/50 bg-white dark:bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Active Sessions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your logged-in devices
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onRefreshSessions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {sessions.map((session) => (
              <div key={session.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {session.device}
                      {session.isCurrent && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.browser} · {session.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {session.lastActive}
                  </span>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onRevokeSession(session.id)}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-destructive/20">
          <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Irreversible and destructive actions
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account, workflows, and all data
              </p>
            </div>
            <Button variant="destructive" onClick={onDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
