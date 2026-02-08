"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Trash2,
  Settings2,
  ArrowLeft,
  Zap,
  Shield,
  Clock,
  ChevronRight,
  Sparkles,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useIntegrations } from "./hooks/useIntegrations";
import {
  integrationCategories,
  integrationTypes,
  getIntegrationsByCategory,
  getIntegrationById,
} from "./constants";
import type { IntegrationType, Integration } from "./types";

type ViewMode = "catalog" | "connected" | "configure";

export default function IntegrationsPage() {
  const { isAuthenticated } = useAuth();
  const {
    integrations,
    isLoading,
    isSaving,
    testingId,
    platformUsage,
    platformLimits,
    addIntegration,
    testIntegration,
    deleteIntegration,
    initiateOAuth,
  } = useIntegrations();

  const [viewMode, setViewMode] = React.useState<ViewMode>("catalog");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = React.useState<IntegrationType | null>(null);
  const [editingIntegration, setEditingIntegration] = React.useState<Integration | null>(null);
  const [configValues, setConfigValues] = React.useState<Record<string, string>>({});
  const [integrationName, setIntegrationName] = React.useState("");
  const [showSecrets, setShowSecrets] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Filter integrations based on search and category
  const filteredIntegrations = React.useMemo(() => {
    let filtered = integrationTypes;
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.label.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [selectedCategory, searchQuery]);

  // Handle integration selection for configuration
  const handleSelectIntegrationType = (integrationType: IntegrationType) => {
    setSelectedIntegration(integrationType);
    setIntegrationName(`My ${integrationType.label}`);
    setConfigValues({});
    setShowSecrets({});
    setError(null);
    setViewMode("configure");
  };

  // Handle OAuth flow
  const handleOAuthConnect = async (integrationType: IntegrationType) => {
    const authUrl = await initiateOAuth(integrationType.id);
    if (authUrl) {
      window.location.href = authUrl;
    } else {
      setError("Failed to initiate OAuth flow");
    }
  };

  // Handle form submission
  const handleSaveIntegration = async () => {
    if (!selectedIntegration || !integrationName.trim()) return;

    // Validate required fields
    const missingFields = selectedIntegration.fields
      .filter((f) => f.required && !configValues[f.key]?.trim())
      .map((f) => f.label);

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    try {
      setError(null);
      await addIntegration(selectedIntegration.id, integrationName, configValues);
      setSuccess("Integration added successfully!");
      setTimeout(() => {
        setSuccess(null);
        setViewMode("connected");
        setSelectedIntegration(null);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add integration");
    }
  };

  // Handle test integration
  const handleTestIntegration = async (integration: Integration) => {
    const result = await testIntegration(integration.id);
    if (result.success) {
      setSuccess(result.message || "Integration test successful!");
    } else {
      setError(result.message || "Integration test failed");
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  // Handle delete integration
  const handleDeleteIntegration = async (integration: Integration) => {
    if (!confirm(`Delete "${integration.name}"? This action cannot be undone.`)) return;
    const success = await deleteIntegration(integration.id);
    if (success) {
      setSuccess("Integration deleted");
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  // Render the catalog view
  const renderCatalog = () => (
    <div className="space-y-8">
      {/* Platform Email Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-6 text-white shadow-xl"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -right-5 -bottom-5 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Platform Email Included</h3>
              <p className="mt-1 text-sm text-blue-100">
                Send up to {platformLimits.email} emails/month free. No setup required.
              </p>
              <div className="mt-4 flex items-center gap-4">
                <div className="h-2 w-48 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${((platformUsage.email || 0) / platformLimits.email) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {platformUsage.email || 0} / {platformLimits.email} used
                </span>
              </div>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0">Free Tier</Badge>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "catalog" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("catalog")}
          >
            <Zap className="h-4 w-4 mr-2" />
            All Apps
          </Button>
          <Button
            variant={viewMode === "connected" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("connected")}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Connected ({integrations.length})
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            !selectedCategory
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted hover:bg-muted/80 text-muted-foreground"
          )}
        >
          All
        </button>
        {integrationCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Integration Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredIntegrations.map((integration, index) => {
          const Icon = integration.icon;
          const isConnected = integrations.some((i) => i.type === integration.id);

          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "group relative rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:border-primary/50",
                isConnected && "ring-2 ring-emerald-500/20"
              )}
            >
              {isConnected && (
                <div className="absolute -top-2 -right-2">
                  <div className="flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white shadow-md">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={cn("rounded-xl p-3", integration.bgColor)}>
                  <Icon className={cn("h-6 w-6", integration.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{integration.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {integration.description}
                  </p>
                </div>
              </div>

              {integration.features && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {integration.features.slice(0, 3).map((feature) => (
                    <span
                      key={feature}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                {integration.docsUrl && (
                  <a
                    href={integration.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Docs
                  </a>
                )}
                <Button
                  size="sm"
                  onClick={() =>
                    integration.authType === "oauth"
                      ? handleOAuthConnect(integration)
                      : handleSelectIntegrationType(integration)
                  }
                  className="ml-auto"
                >
                  {isConnected ? (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Another
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-1" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="py-12 text-center">
          <Zap className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-medium">No integrations found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filter
          </p>
        </div>
      )}
    </div>
  );

  // Render connected integrations view
  const renderConnected = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Connected Integrations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your connected services and credentials
          </p>
        </div>
        <Button onClick={() => setViewMode("catalog")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : integrations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-dashed border-muted-foreground/25 p-12 text-center"
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Zap className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No integrations connected</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Connect your first integration to start automating your workflows with
            external services.
          </p>
          <Button className="mt-6" onClick={() => setViewMode("catalog")}>
            <Plus className="h-4 w-4 mr-2" />
            Browse Integrations
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {integrations.map((integration, index) => {
            const typeInfo = getIntegrationById(integration.type);
            const Icon = typeInfo?.icon || Zap;

            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-xl border bg-card p-4 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("rounded-xl p-3", typeInfo?.bgColor || "bg-muted")}>
                      <Icon className={cn("h-5 w-5", typeInfo?.color || "text-muted-foreground")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{integration.name}</h3>
                        {integration.isActive ? (
                          <Badge variant="success" className="text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="capitalize">{typeInfo?.label || integration.type}</span>
                        {integration.lastUsedAt && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last used {new Date(integration.lastUsedAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestIntegration(integration)}
                      disabled={testingId === integration.id}
                    >
                      {testingId === integration.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="ml-2 hidden sm:inline">Test</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteIntegration(integration)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Render configuration view
  const renderConfigure = () => {
    if (!selectedIntegration) return null;
    const Icon = selectedIntegration.icon;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setViewMode("catalog");
              setSelectedIntegration(null);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className={cn("rounded-xl p-3", selectedIntegration.bgColor)}>
            <Icon className={cn("h-6 w-6", selectedIntegration.color)} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Connect {selectedIntegration.label}</h2>
            <p className="text-sm text-muted-foreground">{selectedIntegration.description}</p>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="rounded-2xl border bg-card p-6 space-y-6">
          {/* Integration Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">Integration Name</label>
            <Input
              value={integrationName}
              onChange={(e) => setIntegrationName(e.target.value)}
              placeholder={`My ${selectedIntegration.label}`}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              A friendly name to identify this integration
            </p>
          </div>

          {/* Dynamic Fields */}
          {selectedIntegration.fields.map((field) => (
            <div key={field.key}>
              <label className="text-sm font-medium mb-2 block">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              <div className="relative">
                {field.type === "select" ? (
                  <select
                    value={configValues[field.key] || field.options?.[0]?.value || ""}
                    onChange={(e) =>
                      setConfigValues({ ...configValues, [field.key]: e.target.value })
                    }
                    className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={configValues[field.key] || ""}
                    onChange={(e) =>
                      setConfigValues({ ...configValues, [field.key]: e.target.value })
                    }
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                ) : (
                  <>
                    <Input
                      type={
                        field.type === "password" && !showSecrets[field.key]
                          ? "password"
                          : "text"
                      }
                      value={configValues[field.key] || ""}
                      onChange={(e) =>
                        setConfigValues({ ...configValues, [field.key]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      className="h-11 pr-10"
                    />
                    {field.type === "password" && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowSecrets({ ...showSecrets, [field.key]: !showSecrets[field.key] })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSecrets[field.key] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
              {field.hint && (
                <p className="text-xs text-muted-foreground mt-1.5">{field.hint}</p>
              )}
            </div>
          ))}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Documentation Link */}
          {selectedIntegration.docsUrl && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/50">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Need help?</p>
                <p className="text-xs text-muted-foreground">
                  Check the official documentation for setup instructions
                </p>
              </div>
              <a
                href={selectedIntegration.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View Docs
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setViewMode("catalog");
                setSelectedIntegration(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveIntegration}
              disabled={isSaving || !integrationName.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Connect Integration
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Features List */}
        {selectedIntegration.features && (
          <div className="mt-6 rounded-xl border bg-card p-5">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              What you can do with {selectedIntegration.label}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {selectedIntegration.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-6xl py-8 px-4">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="mt-2 text-muted-foreground">
            Connect external services to supercharge your workflows
          </p>
        </motion.div>

        {/* Toast Notifications */}
        <AnimatePresence>
          {(error || success) && viewMode !== "configure" && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg",
                error ? "bg-destructive text-destructive-foreground" : "bg-emerald-500 text-white"
              )}
            >
              {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              <span className="text-sm font-medium">{error || success}</span>
              <button
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                }}
                className="ml-2 hover:opacity-80"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === "configure" ? (
            <motion.div
              key="configure"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderConfigure()}
            </motion.div>
          ) : viewMode === "connected" ? (
            <motion.div
              key="connected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderConnected()}
            </motion.div>
          ) : (
            <motion.div
              key="catalog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderCatalog()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
