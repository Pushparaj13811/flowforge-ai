"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSettings, useTheme } from "./hooks";
import type { SettingsSection } from "./types";
import {
  SettingsSidebar,
  ProfileSection,
  IntegrationsSection,
  NotificationsSection,
  AppearanceSection,
  SecuritySection,
  ApiKeysSection,
  HelpSection,
  ChangePasswordModal,
  DeleteAccountModal,
  CreateApiKeyModal,
} from "./components";

const validSections: SettingsSection[] = ["profile", "integrations", "notifications", "appearance", "security", "api-keys", "help"];

function SettingsPageContent() {
  const { isAuthenticated } = useAuth();
  const { theme, handleThemeChange } = useTheme();
  const searchParams = useSearchParams();

  // Get section from URL query param or default to "profile"
  const sectionParam = searchParams.get("section") as SettingsSection | null;
  const initialSection = sectionParam && validSections.includes(sectionParam) ? sectionParam : "profile";
  const [activeSection, setActiveSection] = React.useState<SettingsSection>(initialSection);

  // Update section when URL changes
  React.useEffect(() => {
    if (sectionParam && validSections.includes(sectionParam)) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showCreateApiKey, setShowCreateApiKey] = React.useState(false);

  const settings = useSettings(isAuthenticated, activeSection);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-background dark:via-background dark:to-background">
      {/* Page Header */}
      <div className="sticky top-14 z-20 h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Settings</h1>
          <p className="text-xs text-muted-foreground">
            Manage your account, integrations, and preferences
          </p>
        </div>
        {settings.saveSuccess && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Changes saved
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <AnimatePresence mode="wait">
              {activeSection === "profile" && (
                <ProfileSection
                  isSaving={settings.isSaving}
                  onSave={settings.showSaveSuccess}
                />
              )}

              {activeSection === "integrations" && <IntegrationsSection />}

              {activeSection === "notifications" && (
                <NotificationsSection
                  notifications={settings.notifications}
                  onToggle={settings.handleNotificationToggle}
                />
              )}

              {activeSection === "appearance" && (
                <AppearanceSection
                  theme={theme}
                  onThemeChange={handleThemeChange}
                />
              )}

              {activeSection === "security" && (
                <SecuritySection
                  sessions={settings.sessions}
                  isLoading={settings.isLoadingSessions}
                  onPasswordChange={() => setShowPasswordModal(true)}
                  onRevokeSession={settings.handleRevokeSession}
                  onDeleteAccount={() => setShowDeleteModal(true)}
                  onRefreshSessions={settings.fetchSessions}
                />
              )}

              {activeSection === "api-keys" && (
                <ApiKeysSection
                  apiKeys={settings.apiKeys}
                  onCreateClick={() => setShowCreateApiKey(true)}
                  onDelete={settings.handleDeleteApiKey}
                />
              )}

              {activeSection === "help" && <HelpSection />}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />

      <CreateApiKeyModal
        isOpen={showCreateApiKey}
        isSaving={settings.isSaving}
        onClose={() => setShowCreateApiKey(false)}
        onCreate={settings.handleCreateApiKey}
      />
    </div>
  );
}

// Loading fallback for Suspense
function SettingsLoading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[#fafbfc] dark:bg-background">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading settings...</span>
      </div>
    </div>
  );
}

// Wrap with Suspense to handle useSearchParams
export default function SettingsPage() {
  return (
    <React.Suspense fallback={<SettingsLoading />}>
      <SettingsPageContent />
    </React.Suspense>
  );
}
