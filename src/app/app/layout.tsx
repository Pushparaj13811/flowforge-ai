"use client";

import { TamboProvider } from "@tambo-ai/react";
import { components, tools, workflowContextHelpers } from "@/lib/tambo";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/toast";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY ?? "";

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Missing API Key</h1>
          <p className="text-muted-foreground">
            Please set NEXT_PUBLIC_TAMBO_API_KEY in your .env.local file
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <TamboProvider
        apiKey={apiKey}
        components={components}
        tools={tools}
        contextHelpers={workflowContextHelpers}
      >
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </TamboProvider>
    </AuthProvider>
  );
}
