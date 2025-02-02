"use client";

import { Loader2, Copy } from "lucide-react";
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

  const authMethod = (config.authMethod as string) || "url_token";

  // Default webhook trigger
  return (
    <>
      <FormField label="Webhook URL" hint="Send POST requests to this URL to trigger workflow">
        <div className="flex flex-col gap-2">
          {triggerData?.webhookUrl ? (
            <>
              <Input
                value={triggerData.webhookUrl}
                readOnly
                className="h-8 text-sm bg-muted font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1"
                  onClick={handleCopyWebhook}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1"
                  onClick={handleGenerateWebhook}
                  disabled={isGenerating}
                >
                  Regenerate
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="h-8"
              onClick={handleGenerateWebhook}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                "Generate Webhook URL"
              )}
            </Button>
          )}
        </div>
      </FormField>

      {/* Authentication Method Selector */}
      {triggerData && (
        <FormField label="Authentication Method" hint="How to secure your webhook">
          <div className="space-y-2">
            {/* Bearer Token Option */}
            <label className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              authMethod === "bearer"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}>
              <input
                type="radio"
                name="authMethod"
                value="bearer"
                checked={authMethod === "bearer"}
                onChange={(e) => handleAuthMethodChange(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Bearer Token</span>
                  <span className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded">Most Secure</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add token in Authorization header
                </p>
                {authMethod === "bearer" && triggerData.bearerToken && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={triggerData.bearerToken}
                        readOnly
                        className="h-7 text-[10px] bg-green-50 dark:bg-green-950/30 font-mono border-green-200 dark:border-green-800"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0"
                        onClick={handleCopyToken}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <code className="block text-xs font-mono bg-muted p-2 rounded break-all">
                      Authorization: Bearer {triggerData.bearerToken}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] w-full"
                      onClick={async () => {
                        const success = await copyToClipboard(`Authorization: Bearer ${triggerData.bearerToken}`, "header");
                        if (success) alert("Header copied!");
                      }}
                    >
                      Copy Header
                    </Button>
                  </div>
                )}
              </div>
            </label>

            {/* HMAC Signature Option */}
            <label className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              authMethod === "hmac"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}>
              <input
                type="radio"
                name="authMethod"
                value="hmac"
                checked={authMethod === "hmac"}
                onChange={(e) => handleAuthMethodChange(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">HMAC Signature</span>
                  <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded">Recommended</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sign payload with secret and add X-Webhook-Signature header
                </p>
                {authMethod === "hmac" && triggerData.hmacSecret && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={triggerData.hmacSecret}
                        readOnly
                        className="h-7 text-[10px] bg-blue-50 dark:bg-blue-950/30 font-mono border-blue-200 dark:border-blue-800"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 shrink-0"
                        onClick={handleCopyToken}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400">
                      Use this secret to sign your request body
                    </p>
                    <code className="block text-xs font-mono bg-muted p-2 rounded break-all">
                      X-Webhook-Signature: sha256=HMAC_SHA256(body, secret)
                    </code>
                    <div className="text-[10px] p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                      <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Node.js Example:</p>
                      <pre className="text-blue-600 dark:text-blue-400 whitespace-pre-wrap">
{`const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', '${triggerData.hmacSecret}')
  .update(JSON.stringify(body))
  .digest('hex');`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </label>

            {/* URL Token Only Option */}
            <label className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              authMethod === "url_token"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}>
              <input
                type="radio"
                name="authMethod"
                value="url_token"
                checked={authMethod === "url_token"}
                onChange={(e) => handleAuthMethodChange(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">URL Token Only</span>
                  <span className="text-xs px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded">Basic</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Token is embedded in the URL (least secure, but simplest)
                </p>
                {authMethod === "url_token" && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">
                    No extra authentication needed - the URL contains the token. Use for testing only.
                  </p>
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

      {/* Usage Instructions */}
      {triggerData && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md space-y-3">
          <div>
            <p className="font-medium mb-1">How to use:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Copy the webhook URL above</li>
              {authMethod === "bearer" && <li>Add the Bearer token to your Authorization header</li>}
              {authMethod === "hmac" && <li>Sign your request body with the HMAC secret</li>}
              <li>Send POST requests with JSON data to trigger this workflow</li>
            </ol>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="font-medium mb-2">Example cURL Command:</p>
            {authMethod === "bearer" && triggerData.bearerToken && (
              <div className="relative">
                <code className="block text-[10px] font-mono bg-muted p-2 rounded break-all whitespace-pre-wrap">
{`curl -X POST "${triggerData.webhookUrl}" \\
  -H "Authorization: Bearer ${triggerData.bearerToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John", "email": "john@example.com"}'`}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-6 text-[10px]"
                  onClick={async () => {
                    const success = await copyToClipboard(`curl -X POST "${triggerData.webhookUrl}" -H "Authorization: Bearer ${triggerData.bearerToken}" -H "Content-Type: application/json" -d '{"name": "John", "email": "john@example.com"}'`, "curl-bearer");
                    if (success) alert("cURL command copied!");
                  }}
                >
                  Copy
                </Button>
              </div>
            )}
            {authMethod === "url_token" && (
              <div className="relative">
                <code className="block text-[10px] font-mono bg-muted p-2 rounded break-all whitespace-pre-wrap">
{`curl -X POST "${triggerData.webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John", "email": "john@example.com"}'`}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-6 text-[10px]"
                  onClick={async () => {
                    const success = await copyToClipboard(`curl -X POST "${triggerData.webhookUrl}" -H "Content-Type: application/json" -d '{"name": "John", "email": "john@example.com"}'`, "curl-token");
                    if (success) alert("cURL command copied!");
                  }}
                >
                  Copy
                </Button>
              </div>
            )}
            {authMethod === "hmac" && triggerData.hmacSecret && (
              <div className="space-y-2">
                <p className="text-[10px]">For HMAC, you need to compute the signature in code:</p>
                <div className="relative">
                  <code className="block text-[10px] font-mono bg-muted p-2 rounded break-all whitespace-pre-wrap">
{`curl -X POST "${triggerData.webhookUrl}" \\
  -H "X-Webhook-Signature: sha256=<computed_signature>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John", "email": "john@example.com"}'`}
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
