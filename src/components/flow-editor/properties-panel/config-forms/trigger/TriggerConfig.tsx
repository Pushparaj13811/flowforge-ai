"use client";

import { Loader2, Copy, Shield, KeyRound, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopyToClipboard } from "@/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "../../ui/FormField";
import { useWebhookTrigger } from "../../hooks/useWebhookTrigger";
import { ExpectedDataFields } from "./ExpectedDataFields";
import { ScheduleTriggerConfig } from "./ScheduleTriggerConfig";
import { FormTriggerConfig } from "./FormTriggerConfig";
import type { ConfigComponentProps } from "../../types";

interface TriggerConfigProps extends ConfigComponentProps {
  icon?: string;
}

export function TriggerConfig({ config, onChange, icon }: TriggerConfigProps) {
  const {
    isGenerating,
    triggerData,
    isWorkflowSaved,
    handleGenerateWebhook,
    handleAuthMethodChange,
    handleCopyWebhook,
    handleCopyToken,
  } = useWebhookTrigger(config, onChange);
  const { copyToClipboard } = useCopyToClipboard();

  // Form Submit trigger
  if (icon === "file-text" || icon === "form") {
    return <FormTriggerConfig config={config} onChange={onChange} />;
  }

  // Schedule trigger
  if (icon === "clock") {
    return <ScheduleTriggerConfig config={config} onChange={onChange} />;
  }

  // Default to bearer (never url_token)
  const authMethod = (config.authMethod as string) || "bearer";

  // Default webhook trigger
  return (
    <>
      {/* Webhook URL Section */}
      <FormField label="Webhook Endpoint" hint="External services send POST requests here to trigger this workflow">
        <div className="flex flex-col gap-2">
          {!isWorkflowSaved ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                Save workflow first
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                The workflow must be saved before generating a webhook endpoint.
              </p>
            </div>
          ) : triggerData?.webhookUrl ? (
            <>
              <div className="relative">
                <Input
                  value={triggerData.webhookUrl}
                  readOnly
                  className="h-9 text-sm bg-muted/50 font-mono text-xs pr-20"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 text-xs"
                  onClick={handleCopyWebhook}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <Shield className="h-3.5 w-3.5" />
                <span>Secured with {authMethod === "hmac" ? "HMAC signature" : "Bearer token"} authentication</span>
              </div>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="h-9"
              onClick={handleGenerateWebhook}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Generate Webhook URL
                </>
              )}
            </Button>
          )}
        </div>
      </FormField>

      {/* Authentication Method - Only Bearer and HMAC */}
      {triggerData && (
        <FormField label="Authentication" hint="All webhooks require authentication to prevent unauthorized access">
          <div className="space-y-2">
            {/* Bearer Token */}
            <label className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              authMethod === "bearer"
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm"
                : "border-border hover:border-muted-foreground/30"
            )}>
              <input
                type="radio"
                name="authMethod"
                value="bearer"
                checked={authMethod === "bearer"}
                onChange={(e) => handleAuthMethodChange(e.target.value)}
                className="mt-0.5 accent-emerald-600"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-sm">Bearer Token</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded font-medium">Recommended</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Simple and secure. Include token in the Authorization header.
                </p>
                {authMethod === "bearer" && triggerData.bearerToken && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1.5">
                      <Input
                        value={triggerData.bearerToken}
                        readOnly
                        className="h-7 text-[11px] bg-emerald-50 dark:bg-emerald-950/30 font-mono border-emerald-200 dark:border-emerald-800 flex-1 min-w-0"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0 text-xs"
                        onClick={handleCopyToken}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="relative">
                      <code className="block text-[11px] font-mono bg-zinc-900 text-emerald-400 p-3 rounded-md break-all whitespace-pre-wrap leading-relaxed">
{`curl -X POST "${triggerData.webhookUrl}" \\
  -H "Authorization: Bearer ${triggerData.bearerToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John", "email": "john@example.com"}'`}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-1.5 right-1.5 h-6 text-[10px] text-zinc-400 hover:text-white"
                        onClick={async () => {
                          await copyToClipboard(`curl -X POST "${triggerData.webhookUrl}" -H "Authorization: Bearer ${triggerData.bearerToken}" -H "Content-Type: application/json" -d '{"name": "John", "email": "john@example.com"}'`, "curl-bearer");
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </label>

            {/* HMAC Signature */}
            <label className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              authMethod === "hmac"
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
                : "border-border hover:border-muted-foreground/30"
            )}>
              <input
                type="radio"
                name="authMethod"
                value="hmac"
                checked={authMethod === "hmac"}
                onChange={(e) => handleAuthMethodChange(e.target.value)}
                className="mt-0.5 accent-blue-600"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">HMAC Signature</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-medium">Advanced</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cryptographically sign each request to verify payload integrity.
                </p>
                {authMethod === "hmac" && triggerData.hmacSecret && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300 mb-1">Signing Secret</p>
                      <div className="flex gap-1.5">
                        <Input
                          value={triggerData.hmacSecret}
                          readOnly
                          className="h-7 text-[11px] bg-blue-50 dark:bg-blue-950/30 font-mono border-blue-200 dark:border-blue-800 flex-1 min-w-0"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 shrink-0 text-xs"
                          onClick={handleCopyToken}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-[11px] p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="font-medium text-blue-700 dark:text-blue-300 mb-1.5">How to sign:</p>
                      <code className="block font-mono text-blue-600 dark:text-blue-400 whitespace-pre-wrap leading-relaxed">
{`signature = HMAC_SHA256(request_body, secret)
// Add header: X-Webhook-Signature: sha256=<signature>`}
                      </code>
                    </div>
                    <div className="relative">
                      <code className="block text-[11px] font-mono bg-zinc-900 text-blue-400 p-3 rounded-md break-all whitespace-pre-wrap leading-relaxed">
{`curl -X POST "${triggerData.webhookUrl}" \\
  -H "X-Webhook-Signature: sha256=<signature>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John", "email": "john@example.com"}'`}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </FormField>
      )}

      {/* Expected Data Fields */}
      <div className="mt-4 pt-4 border-t border-border">
        <ExpectedDataFields config={config} onChange={onChange} />
      </div>
    </>
  );
}
