"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  TrendingUp,
  ArrowRight,
  Workflow,
  Mail,
  Clock,
  Bell,
  Repeat,
  Database,
  MessageSquare,
  GitBranch,
  Bot,
  X,
  Play,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { workflowTemplates } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "All Templates", count: workflowTemplates.length },
  { id: "Sales", label: "Sales", count: workflowTemplates.filter(t => t.category === "Sales").length },
  { id: "Marketing", label: "Marketing", count: workflowTemplates.filter(t => t.category === "Marketing").length },
  { id: "Operations", label: "Operations", count: workflowTemplates.filter(t => t.category === "Operations").length },
  { id: "Support", label: "Support", count: workflowTemplates.filter(t => t.category === "Support").length },
  { id: "Finance", label: "Finance", count: workflowTemplates.filter(t => t.category === "Finance").length },
];

const iconMap: Record<string, React.ReactNode> = {
  "message-square": <MessageSquare className="h-5 w-5" />,
  mail: <Mail className="h-5 w-5" />,
  clock: <Clock className="h-5 w-5" />,
  bell: <Bell className="h-5 w-5" />,
  repeat: <Repeat className="h-5 w-5" />,
  database: <Database className="h-5 w-5" />,
  workflow: <Workflow className="h-5 w-5" />,
  "git-branch": <GitBranch className="h-5 w-5" />,
};

type WorkflowTemplate = typeof workflowTemplates[0];

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [previewTemplate, setPreviewTemplate] = React.useState<WorkflowTemplate | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  const filteredTemplates = workflowTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    setIsCreating(true);
    try {
      // Create workflow from template
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          status: "draft",
          nodes: template.nodes,
          edges: template.edges,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workflow");
      }

      const data = await response.json();

      // Navigate to workflow editor
      if (data.workflow?.id) {
        router.push(`/app/workflows/${data.workflow.id}`);
      }
    } catch (error) {
      console.error("Failed to create workflow from template:", error);
      alert("Failed to create workflow. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#fafbfc] dark:bg-background">
      {/* Page Header */}
      <div className="sticky top-14 z-20 h-14 flex items-center justify-between px-6 bg-white/95 dark:bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div>
          <h1 className="text-sm font-semibold">Templates</h1>
          <p className="text-xs text-muted-foreground">
            Start with pre-built workflow templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => router.push("/app")}>
            <Bot className="h-3.5 w-3.5" />
            Create with AI
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Search and Category Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-9 pr-3 text-sm rounded-lg border border-border/50 bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "px-3 h-8 text-xs font-medium rounded-lg transition-colors",
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-white dark:bg-card text-muted-foreground hover:text-foreground border border-border/50"
                )}
              >
                {category.label}
                <span className="ml-1.5 opacity-70">({category.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="h-full rounded-xl border-2 border-border/50 bg-white dark:bg-card p-4 hover:shadow-lg hover:border-border transition-all group">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-flow flex items-center justify-center shrink-0">
                      <span className="text-white">
                        {iconMap[template.icon] || <Workflow className="h-4 w-4" />}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{template.name}</h3>
                      <Badge variant="outline" className="text-xs mt-0.5 h-5">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span>{template.popularity}%</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4">
                  {template.description}
                </p>

                {/* Mini workflow preview */}
                <div className="bg-muted/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {template.nodes.slice(0, 4).map((node, i) => (
                      <React.Fragment key={node.id}>
                        <div
                          className={cn(
                            "h-7 w-7 rounded flex items-center justify-center text-white text-xs font-medium",
                            node.type === "trigger" && "bg-flow-blue",
                            node.type === "action" && "bg-flow-green",
                            node.type === "condition" && "bg-flow-purple",
                            node.type === "delay" && "bg-flow-orange",
                            node.type === "loop" && "bg-flow-cyan"
                          )}
                          title={node.label}
                        >
                          {node.type[0].toUpperCase()}
                        </div>
                        {i < Math.min(template.nodes.length - 1, 3) && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </React.Fragment>
                    ))}
                    {template.nodes.length > 4 && (
                      <span className="text-xs text-muted-foreground">
                        +{template.nodes.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {template.nodes.length} steps
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 gap-1"
                      onClick={() => handleUseTemplate(template)}
                      disabled={isCreating}
                    >
                      Use Template
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-sm font-semibold mb-1">No templates found</h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border-2 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10 p-6"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-1">
                Can&apos;t find what you need?
              </h3>
              <p className="text-xs text-muted-foreground">
                Describe your workflow in natural language and our AI will build it for you.
              </p>
            </div>
            <Button className="h-8 gap-1.5 shrink-0" onClick={() => router.push("/app")}>
              <Bot className="h-3.5 w-3.5" />
              Create with AI
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setPreviewTemplate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border-2 border-border rounded-xl w-full max-w-3xl shadow-xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-flow flex items-center justify-center">
                    {iconMap[previewTemplate.icon] || <Workflow className="h-5 w-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{previewTemplate.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs h-5">
                        {previewTemplate.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {previewTemplate.nodes.length} steps
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPreviewTemplate(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-xs font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {previewTemplate.description}
                    </p>
                  </div>

                  {/* Workflow Steps */}
                  <div>
                    <h3 className="text-xs font-semibold mb-3">Workflow Steps</h3>
                    <div className="space-y-3">
                      {previewTemplate.nodes.map((node, index) => (
                        <div
                          key={node.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-medium text-muted-foreground">
                              {index + 1}
                            </span>
                            <div
                              className={cn(
                                "h-8 w-8 rounded flex items-center justify-center text-white text-xs font-medium",
                                node.type === "trigger" && "bg-flow-blue",
                                node.type === "action" && "bg-flow-green",
                                node.type === "condition" && "bg-flow-purple",
                                node.type === "delay" && "bg-flow-orange",
                                node.type === "loop" && "bg-flow-cyan"
                              )}
                            >
                              {node.type[0].toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{node.label}</p>
                            {node.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {node.description}
                              </p>
                            )}
                            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-background text-[10px] font-medium text-muted-foreground capitalize">
                              {node.type}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Popularity */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      <strong>{previewTemplate.popularity}%</strong> of users find this template helpful
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => {
                    handleUseTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  disabled={isCreating}
                >
                  <Play className="h-3.5 w-3.5" />
                  Use This Template
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
