"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  fullWidth?: boolean;
  noPadding?: boolean;
}

// Routes that should render without the sidebar (full-width layout)
const FULL_WIDTH_ROUTES = [
  /^\/app\/workflows\/[^/]+$/, // /app/workflows/[id]
];

// Routes that should hide the header (but keep sidebar)
const NO_HEADER_ROUTES = [
  /^\/app$/, // /app (Build page)
];

export function AppShell({
  children,
  title,
  subtitle,
  showHeader = true,
  fullWidth = false,
  noPadding = false,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const pathname = usePathname();

  // Check if current route should be full-width (no sidebar)
  const isFullWidthRoute = FULL_WIDTH_ROUTES.some((pattern) => pattern.test(pathname));

  // Check if current route should hide header
  const shouldHideHeader = NO_HEADER_ROUTES.some((pattern) => pattern.test(pathname));

  // If it's a full-width route, just render children without AppShell wrapper
  if (isFullWidthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content */}
      <motion.main
        className="min-h-screen"
        animate={{
          paddingLeft: sidebarCollapsed ? 64 : 240,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {/* Header */}
        {showHeader && !shouldHideHeader && <Header title={title} subtitle={subtitle} />}

        {/* Page Content */}
        <div
          className={cn(
            !noPadding && "p-6"
          )}
        >
          {noPadding ? (
            children
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          )}
        </div>
      </motion.main>
    </div>
  );
}
