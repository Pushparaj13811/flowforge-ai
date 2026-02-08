"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ValidationError } from "@/lib/workflow-validator";
import type { ExecutionResult } from "@/types/workflow";

interface ExecutionBannerProps {
  validationErrors: ValidationError[] | null;
  executionError: string | null;
  executionResult: ExecutionResult | null;
  isExecuting: boolean;
  onDismissValidation: () => void;
  onDismissError: () => void;
  onDismissResult: () => void;
}

export function ExecutionBanner({
  validationErrors,
  executionError,
  executionResult,
  isExecuting,
  onDismissValidation,
  onDismissError,
  onDismissResult,
}: ExecutionBannerProps) {
  const showBanner = validationErrors || executionError || executionResult;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-b border-border/50 bg-white dark:bg-card"
        >
          <div className="px-4 py-3">
            {validationErrors && (
              <ValidationErrorAlert
                errors={validationErrors}
                onDismiss={onDismissValidation}
              />
            )}

            {executionError && (
              <ExecutionErrorAlert
                error={executionError}
                onDismiss={onDismissError}
              />
            )}

            {executionResult && !validationErrors && !executionError && (
              <ExecutionResultAlert
                result={executionResult}
                isExecuting={isExecuting}
                onDismiss={onDismissResult}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ValidationErrorAlert({
  errors,
  onDismiss,
}: {
  errors: ValidationError[];
  onDismiss: () => void;
}) {
  return (
    <Alert variant="destructive" className="mb-0">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Workflow Validation Failed</AlertTitle>
      <AlertDescription className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-4">
          {errors.map((err, i) => (
            <div key={i} className="space-y-2">
              <div className="font-medium">
                {err.nodeLabel && (
                  <span className="text-destructive-foreground">
                    {err.nodeLabel}:{" "}
                  </span>
                )}
                {err.message}
              </div>
              {err.howToFix && (
                <div className="text-sm bg-destructive/10 dark:bg-destructive/20 rounded-md p-2 border border-destructive/20">
                  <div className="font-medium mb-1">How to fix:</div>
                  <div>{err.howToFix}</div>
                </div>
              )}
              {err.example && (
                <div className="text-sm bg-muted rounded-md p-2 font-mono text-xs whitespace-pre-wrap">
                  {err.example}
                </div>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function ExecutionErrorAlert({
  error,
  onDismiss,
}: {
  error: string;
  onDismiss: () => void;
}) {
  return (
    <Alert variant="destructive" className="mb-0">
      <XCircle className="h-4 w-4" />
      <AlertTitle>Execution Error</AlertTitle>
      <AlertDescription className="flex items-start justify-between gap-2">
        <div className="flex-1">{error}</div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function ExecutionResultAlert({
  result,
  isExecuting,
  onDismiss,
}: {
  result: ExecutionResult;
  isExecuting: boolean;
  onDismiss: () => void;
}) {
  const isCompleted = result.status === "completed";
  const isFailed = result.status === "failed";

  return (
    <Alert
      variant={isCompleted ? "default" : "destructive"}
      className="mb-0"
    >
      {isCompleted ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : isExecuting ? (
        <Clock className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <AlertTitle>
        {isCompleted
          ? "Workflow Executed Successfully"
          : isExecuting
          ? "Workflow Running..."
          : "Workflow Failed"}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          {isCompleted && `Completed in ${result.duration}ms`}
          {isExecuting && "Your workflow is running in the background..."}
          {isFailed && result.error}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
