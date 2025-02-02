"use client";

/**
 * Node Palette - Left sidebar with draggable node templates
 * Clean, professional design matching modern workflow editors
 */

import * as React from "react";
import {
  Webhook,
  Cog,
  GitBranch,
  Clock,
  Repeat,
  Mail,
  MessageSquare,
  Database,
  Bell,
  Filter,
  Zap,
  Play,
  Globe,
  ChevronDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeTemplate, WorkflowNodeType } from "./types";

// Node templates organized by category
const nodeTemplates: NodeTemplate[] = [
  // Triggers
  { type: "trigger", label: "Webhook", description: "Receive HTTP requests", icon: "webhook", category: "Triggers" },
  { type: "trigger", label: "Schedule", description: "Run on a schedule", icon: "clock", category: "Triggers" },
  { type: "trigger", label: "Event", description: "Listen for events", icon: "zap", category: "Triggers" },
  { type: "trigger", label: "Form Submit", description: "On form submission", icon: "play", category: "Triggers" },

  // Communication Actions
  { type: "action", label: "Send Email", description: "Send via Resend API", icon: "mail", category: "Communication" },
  { type: "action", label: "Slack Message", description: "Post to Slack channel", icon: "message-square", category: "Communication" },
  { type: "action", label: "Discord Message", description: "Send via webhook", icon: "message-square", category: "Communication" },
  { type: "action", label: "Teams Message", description: "Post to Microsoft Teams", icon: "message-square", category: "Communication" },
  { type: "action", label: "Send SMS", description: "Send via Twilio", icon: "message-square", category: "Communication" },

  // AI Actions
  { type: "action", label: "OpenAI Chat", description: "GPT chat completion", icon: "zap", category: "AI" },
  { type: "action", label: "Claude AI", description: "Anthropic Claude", icon: "zap", category: "AI" },

  // Data & Integrations
  { type: "action", label: "HTTP Request", description: "Call external API", icon: "globe", category: "Data" },
  { type: "action", label: "Google Sheets", description: "Read/write sheets", icon: "database", category: "Data" },
  { type: "action", label: "Stripe Payment", description: "Create payment", icon: "globe", category: "Data" },
  { type: "action", label: "Transform Data", description: "Map, filter, format", icon: "cog", category: "Data" },

  // Logic
  { type: "condition", label: "If Condition", description: "Branch based on value", icon: "git-branch", category: "Logic" },
  { type: "condition", label: "Switch", description: "Multiple branches", icon: "git-branch", category: "Logic" },
  { type: "condition", label: "Filter", description: "Filter array items", icon: "filter", category: "Logic" },
  { type: "delay", label: "Delay", description: "Wait for duration", icon: "clock", category: "Logic" },
  { type: "loop", label: "For Each", description: "Iterate array items", icon: "repeat", category: "Logic" },
  { type: "loop", label: "Repeat", description: "Repeat N times", icon: "repeat", category: "Logic" },
];

const iconComponents: Record<string, React.ElementType> = {
  webhook: Webhook,
  cog: Cog,
  "git-branch": GitBranch,
  clock: Clock,
  repeat: Repeat,
  mail: Mail,
  "message-square": MessageSquare,
  database: Database,
  bell: Bell,
  filter: Filter,
  zap: Zap,
  play: Play,
  globe: Globe,
};

const typeColors: Record<WorkflowNodeType, { bg: string; text: string; icon: string }> = {
  trigger: { bg: "hover:bg-blue-50 dark:hover:bg-blue-950/30", text: "text-blue-600 dark:text-blue-400", icon: "bg-blue-100 dark:bg-blue-900/50" },
  action: { bg: "hover:bg-green-50 dark:hover:bg-green-950/30", text: "text-green-600 dark:text-green-400", icon: "bg-green-100 dark:bg-green-900/50" },
  condition: { bg: "hover:bg-purple-50 dark:hover:bg-purple-950/30", text: "text-purple-600 dark:text-purple-400", icon: "bg-purple-100 dark:bg-purple-900/50" },
  delay: { bg: "hover:bg-orange-50 dark:hover:bg-orange-950/30", text: "text-orange-600 dark:text-orange-400", icon: "bg-orange-100 dark:bg-orange-900/50" },
  loop: { bg: "hover:bg-cyan-50 dark:hover:bg-cyan-950/30", text: "text-cyan-600 dark:text-cyan-400", icon: "bg-cyan-100 dark:bg-cyan-900/50" },
};

interface NodePaletteProps {
  className?: string;
}

export function NodePalette({ className }: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(["Triggers", "Communication", "Data", "Logic"])
  );

  // Filter templates by search
  const filteredTemplates = nodeTemplates.filter(
    (t) =>
      t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const categories = Array.from(new Set(filteredTemplates.map((t) => t.category)));

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    template: NodeTemplate
  ) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({
        type: template.type,
        label: template.label,
        description: template.description,
        icon: template.icon,
      })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <h3 className="font-semibold text-sm mb-3">Add Nodes</h3>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background focus:border-primary focus:outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto">
        {categories.map((category) => (
          <div key={category}>
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50 transition-colors"
            >
              {category}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  !expandedCategories.has(category) && "-rotate-90"
                )}
              />
            </button>

            {/* Category Items */}
            {expandedCategories.has(category) && (
              <div className="px-2 pb-2">
                {filteredTemplates
                  .filter((t) => t.category === category)
                  .map((template) => {
                    const IconComponent = iconComponents[template.icon] || Cog;
                    const colors = typeColors[template.type];
                    return (
                      <div
                        key={`${template.type}-${template.label}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, template)}
                        className={cn(
                          "flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-grab active:cursor-grabbing",
                          "transition-colors duration-150",
                          colors.bg
                        )}
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-md flex items-center justify-center shrink-0",
                          colors.icon
                        )}>
                          <IconComponent className={cn("h-4 w-4", colors.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium", colors.text)}>{template.label}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{template.description}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No nodes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
