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
  ArrowLeft,
  Zap,
  Shield,
  Clock,
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
import { useIntegrations } from "@/app/app/integrations/hooks/useIntegrations";
import {
  integrationCategories,
  integrationTypes,
  getIntegrationById,
} from "@/app/app/integrations/constants";
import type { IntegrationType, Integration } from "@/app/app/integrations/types";
import { validateIntegrationCredentials } from "@/lib/integrations/validators";

type ViewMode = "catalog" | "connected" | "configure" | "type-details";

export function IntegrationsSection() {
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
  const [selectedTypeForDetails, setSelectedTypeForDetails] = React.useState<IntegrationType | null>(null);
  const [configValues, setConfigValues] = React.useState<Record<string, string>>({});
  const [integrationName, setIntegrationName] = React.useState("");
  const [showSecrets, setShowSecrets] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Get connected integrations for a specific type
  const getConnectedForType = (typeId: string) => {
    return integrations.filter((i) => i.type === typeId);
  };

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

  const handleSelectIntegrationType = (integrationType: IntegrationType) => {
    setSelectedIntegration(integrationType);
    setIntegrationName(`My ${integrationType.label}`);
    setConfigValues({});
    setShowSecrets({});
    setError(null);
    setViewMode("configure");
  };

  const handleOAuthConnect = async (integrationType: IntegrationType) => {
    const authUrl = await initiateOAuth(integrationType.id);
    if (authUrl) {
      window.location.href = authUrl;
    } else {
      setError("Failed to initiate OAuth flow");
    }
  };

  const handleSaveIntegration = async () => {
    if (!selectedIntegration || !integrationName.trim()) return;

    const missingFields = selectedIntegration.fields
      .filter((f) => f.required && !configValues[f.key]?.trim())
      .map((f) => f.label);

    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    // Validate credentials format before submitting
    const validation = validateIntegrationCredentials(selectedIntegration.id, configValues);
    if (!validation.valid) {
      setError(validation.errors.join("\n"));
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
    <div className="space-y-6">
      {/* Platform Email Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-5 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/20 p-2.5 backdrop-blur-sm">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Platform Email Included</h3>
              <p className="mt-0.5 text-sm text-blue-100">
                Send up to {platformLimits.email} emails/month free
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-1.5 w-36 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${((platformUsage.email || 0) / platformLimits.email) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium">
                  {platformUsage.email || 0} / {platformLimits.email}
                </span>
              </div>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-0 text-[10px]">Free</Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "catalog" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("catalog")}
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            All
          </Button>
          <Button
            variant={viewMode === "connected" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("connected")}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Connected ({integrations.length})
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            !selectedCategory
              ? "bg-primary text-primary-foreground shadow"
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
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground shadow"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Integration Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredIntegrations.map((integration) => {
          const Icon = integration.icon;
          const connectedCount = getConnectedForType(integration.id).length;
          const isConnected = connectedCount > 0;

          return (
            <div
              key={integration.id}
              onClick={() => {
                if (isConnected) {
                  setSelectedTypeForDetails(integration);
                  setViewMode("type-details");
                }
              }}
              className={cn(
                "group relative rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/50",
                isConnected && "ring-1 ring-emerald-500/20 cursor-pointer"
              )}
            >
              {isConnected && (
                <div className="absolute -top-1.5 -right-1.5">
                  <div className="flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-medium text-white shadow">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    {connectedCount} Connected
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={cn("rounded-lg p-2", integration.bgColor)}>
                  <Icon className={cn("h-5 w-5", integration.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{integration.label}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {integration.description}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                {integration.docsUrl && (
                  <a
                    href={integration.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    Docs
                  </a>
                )}
                <Button
                  size="sm"
                  className="h-7 text-xs ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (integration.authType === "oauth") {
                      handleOAuthConnect(integration);
                    } else {
                      handleSelectIntegrationType(integration);
                    }
                  }}
                >
                  {isConnected ? "Add Another" : "Connect"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="py-8 text-center">
          <Zap className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-3 font-medium text-sm">No integrations found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search or filter
          </p>
        </div>
      )}
    </div>
  );

  // Render connected integrations view
  const renderConnected = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Connected Integrations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your connected services
          </p>
        </div>
        <Button size="sm" onClick={() => setViewMode("catalog")}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : integrations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center">
          <Zap className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-3 font-medium text-sm">No integrations connected</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
            Connect your first integration to start automating
          </p>
          <Button size="sm" className="mt-4" onClick={() => setViewMode("catalog")}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Browse Integrations
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {integrations.map((integration) => {
            const typeInfo = getIntegrationById(integration.type);
            const Icon = typeInfo?.icon || Zap;

            return (
              <div
                key={integration.id}
                className="group rounded-lg border bg-card p-3 transition-all hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-lg p-2", typeInfo?.bgColor || "bg-muted")}>
                      <Icon className={cn("h-4 w-4", typeInfo?.color || "text-muted-foreground")} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{integration.name}</h3>
                        {integration.isActive ? (
                          <Badge variant="success" className="text-[9px] h-4">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] h-4">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="capitalize">{typeInfo?.label || integration.type}</span>
                        {integration.lastUsedAt && (
                          <>
                            <span>·</span>
                            <span>Used {new Date(integration.lastUsedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleTestIntegration(integration)}
                      disabled={testingId === integration.id}
                    >
                      {testingId === integration.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteIntegration(integration)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
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
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setViewMode("catalog");
              setSelectedIntegration(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className={cn("rounded-lg p-2", selectedIntegration.bgColor)}>
            <Icon className={cn("h-5 w-5", selectedIntegration.color)} />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Connect {selectedIntegration.label}</h2>
            <p className="text-xs text-muted-foreground">{selectedIntegration.description}</p>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="rounded-xl border bg-card p-4 space-y-4">
          {/* Integration Name */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Integration Name</label>
            <Input
              value={integrationName}
              onChange={(e) => setIntegrationName(e.target.value)}
              placeholder={`My ${selectedIntegration.label}`}
              className="h-9"
            />
          </div>

          {/* Dynamic Fields */}
          {selectedIntegration.fields.map((field) => (
            <div key={field.key}>
              <label className="text-xs font-medium mb-1.5 block">
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </label>
              <div className="relative">
                {field.type === "select" ? (
                  <select
                    value={configValues[field.key] || field.options?.[0]?.value || ""}
                    onChange={(e) =>
                      setConfigValues({ ...configValues, [field.key]: e.target.value })
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
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
                    rows={2}
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
                      className="h-9 pr-9"
                    />
                    {field.type === "password" && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowSecrets({ ...showSecrets, [field.key]: !showSecrets[field.key] })
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSecrets[field.key] ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
              {field.hint && (
                <p className="text-[10px] text-muted-foreground mt-1">{field.hint}</p>
              )}
            </div>
          ))}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setViewMode("catalog");
                setSelectedIntegration(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleSaveIntegration}
              disabled={isSaving || !integrationName.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </div>

        {/* Documentation Link */}
        {selectedIntegration.docsUrl && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs font-medium">Need help?</p>
            </div>
            <a
              href={selectedIntegration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View Docs
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        )}
      </div>
    );
  };

  // Render type details view - shows all connected integrations for a specific type
  const renderTypeDetails = () => {
    if (!selectedTypeForDetails) return null;
    const Icon = selectedTypeForDetails.icon;
    const connectedIntegrations = getConnectedForType(selectedTypeForDetails.id);

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setViewMode("catalog");
              setSelectedTypeForDetails(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className={cn("rounded-lg p-2", selectedTypeForDetails.bgColor)}>
            <Icon className={cn("h-5 w-5", selectedTypeForDetails.color)} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-sm">{selectedTypeForDetails.label} Integrations</h2>
            <p className="text-xs text-muted-foreground">
              {connectedIntegrations.length} connected integration{connectedIntegrations.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              if (selectedTypeForDetails.authType === "oauth") {
                handleOAuthConnect(selectedTypeForDetails);
              } else {
                handleSelectIntegrationType(selectedTypeForDetails);
              }
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Another
          </Button>
        </div>

        {/* Connected Integrations List */}
        {connectedIntegrations.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-8 text-center">
            <Icon className={cn("mx-auto h-10 w-10", selectedTypeForDetails.color, "opacity-50")} />
            <h3 className="mt-3 font-medium text-sm">No {selectedTypeForDetails.label} integrations</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              Connect your first {selectedTypeForDetails.label} integration
            </p>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => {
                if (selectedTypeForDetails.authType === "oauth") {
                  handleOAuthConnect(selectedTypeForDetails);
                } else {
                  handleSelectIntegrationType(selectedTypeForDetails);
                }
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Connect {selectedTypeForDetails.label}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {connectedIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="group rounded-lg border bg-card p-4 transition-all hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-lg p-2", selectedTypeForDetails.bgColor)}>
                      <Icon className={cn("h-4 w-4", selectedTypeForDetails.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{integration.name}</h3>
                        {integration.isActive ? (
                          <Badge variant="success" className="text-[9px] h-4">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] h-4">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>Created {new Date(integration.createdAt).toLocaleDateString()}</span>
                        {integration.lastUsedAt && (
                          <>
                            <span>·</span>
                            <span>Last used {new Date(integration.lastUsedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleTestIntegration(integration)}
                      disabled={testingId === integration.id}
                    >
                      {testingId === integration.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Test
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteIntegration(integration)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Documentation Link */}
        {selectedTypeForDetails.docsUrl && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs font-medium">Need help with {selectedTypeForDetails.label}?</p>
            </div>
            <a
              href={selectedTypeForDetails.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View Docs
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      key="integrations"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl border border-border/50 bg-white dark:bg-card p-6 shadow-sm"
    >
      {/* Toast Notifications */}
      <AnimatePresence>
        {(error || success) && viewMode !== "configure" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
              error ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            )}
          >
            {error ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            <span className="flex-1">{error || success}</span>
            <button
              onClick={() => {
                setError(null);
                setSuccess(null);
              }}
              className="hover:opacity-80"
            >
              <X className="h-3.5 w-3.5" />
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
        ) : viewMode === "type-details" ? (
          <motion.div
            key="type-details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderTypeDetails()}
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
    </motion.div>
  );
}
