"use client";

import { Button } from "@/components/ui/button";

interface AuthRequiredProps {
  icon: React.ElementType;
  title?: string;
  message?: string;
}

export function AuthRequired({ icon: Icon, title = "Not signed in", message = "Sign in to access this section" }: AuthRequiredProps) {
  return (
    <div className="p-12 text-center">
      <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <Button asChild>
        <a href="/login">Sign In</a>
      </Button>
    </div>
  );
}
