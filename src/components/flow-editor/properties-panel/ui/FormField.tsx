"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";

interface FormFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  tooltip?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  hint,
  required,
  tooltip,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {tooltip && (
            <button
              type="button"
              className="group relative"
              aria-label={`Help for ${label}`}
            >
              <HelpCircle className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50">
                <div className="bg-popover text-popover-foreground text-xs p-2 rounded-lg border border-border shadow-lg max-w-[200px] whitespace-normal">
                  {tooltip}
                </div>
              </div>
            </button>
          )}
        </div>
        {hint && (
          <span className="text-[10px] text-muted-foreground/60">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}
