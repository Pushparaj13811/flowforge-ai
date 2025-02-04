/**
 * @file MiniStats.tsx
 * @description Mini stats display component for dashboards
 */

"use client";

import * as React from "react";

interface MiniStatsProps {
  total: number;
  active: number;
  drafts: number;
}

export function MiniStats({ total, active, drafts }: MiniStatsProps) {
  return (
    <div className="hidden md:flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{total}</span>
        <span className="text-muted-foreground">total</span>
      </div>
      <span className="text-muted-foreground">·</span>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        <span className="font-medium">{active}</span>
        <span className="text-muted-foreground">active</span>
      </div>
      <span className="text-muted-foreground">·</span>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        <span className="font-medium">{drafts}</span>
        <span className="text-muted-foreground">drafts</span>
      </div>
    </div>
  );
}
