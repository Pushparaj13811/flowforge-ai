"use client";

import { motion } from "framer-motion";
import { Key, Plus, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import type { ApiKey } from "../../types";
import { AuthRequired, EmptyState } from "../shared";

interface ApiKeysSectionProps {
  apiKeys: ApiKey[];
  onCreateClick: () => void;
  onDelete: (id: string) => void;
}

export function ApiKeysSection({ apiKeys, onCreateClick, onDelete }: ApiKeysSectionProps) {
  const { isAuthenticated } = useAuth();

  return (
    <motion.div
      key="api-keys"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl border border-border/50 bg-white dark:bg-card shadow-sm overflow-hidden"
    >
      <div className="p-6 border-b border-border/50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create keys to trigger workflows programmatically
          </p>
        </div>
        {isAuthenticated && (
          <Button onClick={onCreateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Key
          </Button>
        )}
      </div>

      {!isAuthenticated ? (
        <AuthRequired icon={Key} message="Sign in to manage API keys" />
      ) : apiKeys.length === 0 ? (
        <EmptyState
          icon={Key}
          title="No API keys yet"
          description="Create an API key to trigger workflows programmatically"
          actionLabel="Create your first API key"
          onAction={onCreateClick}
        />
      ) : (
        <div className="divide-y divide-border/50">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Key className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{apiKey.name}</p>
                    {apiKey.isActive ? (
                      <Badge variant="success" className="text-[10px]">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <code className="px-1.5 py-0.5 bg-muted rounded font-mono">
                      {apiKey.keyPrefix}...
                    </code>
                    <span>·</span>
                    <span>Created {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                    {apiKey.lastUsedAt && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Used {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                    {apiKey.expiresAt && (
                      <>
                        <span>·</span>
                        <span className={new Date(apiKey.expiresAt) < new Date() ? "text-destructive" : ""}>
                          Expires {new Date(apiKey.expiresAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(apiKey.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage Instructions */}
      {isAuthenticated && apiKeys.length > 0 && (
        <div className="p-4 bg-muted/30 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Use your API key in the <code className="px-1 py-0.5 bg-muted rounded">Authorization</code> header:{" "}
            <code className="px-1 py-0.5 bg-muted rounded">Bearer ff_...</code>
          </p>
        </div>
      )}
    </motion.div>
  );
}
