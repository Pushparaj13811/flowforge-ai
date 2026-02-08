/**
 * @file ExampleWorkflows.tsx
 * @description Example workflow templates that users can import with one click
 */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Mail,
  MessageSquare,
  Webhook,
  Clock,
  ShoppingCart,
  UserPlus,
  Bell,
  FileText,
  Zap,
  X,
} from "lucide-react";
import { useFlowStore } from "./store";

interface ExampleWorkflow {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  tags: string[];
  nodes: Array<{
    id: string;
    label: string;
    description?: string;
    icon?: string;
    nodeType: "trigger" | "action" | "condition" | "delay";
    config?: Record<string, unknown>;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    label?: string;
  }>;
}

const EXAMPLE_WORKFLOWS: ExampleWorkflow[] = [
  {
    id: "welcome-email",
    name: "Welcome Email",
    description: "Send a welcome email when a new user signs up",
    icon: UserPlus,
    iconColor: "text-blue-500",
    tags: ["email", "onboarding"],
    nodes: [
      {
        id: "trigger-1",
        label: "User Signup",
        description: "Triggered when a new user signs up",
        icon: "webhook",
        nodeType: "trigger",
        config: {},
        position: { x: 250, y: 100 },
      },
      {
        id: "action-1",
        label: "Send Welcome Email",
        description: "Send a personalized welcome email",
        icon: "mail",
        nodeType: "action",
        config: {
          to: "{{$trigger.data.email}}",
          subject: "Welcome to {{$env.APP_NAME}}, {{$trigger.data.name}}!",
          body: "Hi {{$trigger.data.name}},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team",
        },
        position: { x: 250, y: 250 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "action-1" },
    ],
  },
  {
    id: "order-notification",
    name: "Order Notification",
    description: "Send Slack notification when an order is placed",
    icon: ShoppingCart,
    iconColor: "text-green-500",
    tags: ["slack", "orders", "e-commerce"],
    nodes: [
      {
        id: "trigger-1",
        label: "New Order",
        description: "Triggered when an order is placed",
        icon: "webhook",
        nodeType: "trigger",
        config: {},
        position: { x: 250, y: 100 },
      },
      {
        id: "action-1",
        label: "Slack Notification",
        description: "Post order details to Slack",
        icon: "message-square",
        nodeType: "action",
        config: {
          channel: "#orders",
          message: "🛒 New Order!\n\nOrder ID: {{$trigger.data.orderId}}\nCustomer: {{$trigger.data.customerName}}\nAmount: ${{$trigger.data.amount}}\nItems: {{$trigger.data.itemCount}}",
        },
        position: { x: 250, y: 250 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "action-1" },
    ],
  },
  {
    id: "high-value-order",
    name: "High-Value Order Alert",
    description: "Alert team when order exceeds $500",
    icon: Bell,
    iconColor: "text-amber-500",
    tags: ["condition", "alerts", "e-commerce"],
    nodes: [
      {
        id: "trigger-1",
        label: "New Order",
        description: "Triggered when an order is placed",
        icon: "webhook",
        nodeType: "trigger",
        config: {},
        position: { x: 250, y: 100 },
      },
      {
        id: "condition-1",
        label: "Check Amount",
        description: "Check if order is high value",
        icon: "git-branch",
        nodeType: "condition",
        config: {
          field: "$trigger.data.amount",
          operator: "gt",
          value: "500",
        },
        position: { x: 250, y: 250 },
      },
      {
        id: "action-1",
        label: "Alert Team",
        description: "Send high-value order alert",
        icon: "message-square",
        nodeType: "action",
        config: {
          channel: "#high-value-orders",
          message: "🚨 High-Value Order Alert!\n\nOrder: {{$trigger.data.orderId}}\nAmount: ${{$trigger.data.amount}}",
        },
        position: { x: 150, y: 400 },
      },
      {
        id: "action-2",
        label: "Standard Processing",
        description: "Log standard order",
        icon: "mail",
        nodeType: "action",
        config: {
          to: "orders@company.com",
          subject: "New Order {{$trigger.data.orderId}}",
          body: "A new order has been placed.",
        },
        position: { x: 350, y: 400 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "condition-1" },
      { id: "e2", source: "condition-1", target: "action-1", sourceHandle: "yes", label: "Yes" },
      { id: "e3", source: "condition-1", target: "action-2", sourceHandle: "no", label: "No" },
    ],
  },
  {
    id: "daily-report",
    name: "Daily Summary Report",
    description: "Send a daily email report at 9 AM",
    icon: Clock,
    iconColor: "text-purple-500",
    tags: ["scheduled", "reports", "email"],
    nodes: [
      {
        id: "trigger-1",
        label: "Daily Schedule",
        description: "Runs every day at 9 AM",
        icon: "clock",
        nodeType: "trigger",
        config: {
          cron: "0 9 * * *",
          timezone: "America/New_York",
        },
        position: { x: 250, y: 100 },
      },
      {
        id: "action-1",
        label: "Fetch Report Data",
        description: "Get data from API",
        icon: "globe",
        nodeType: "action",
        config: {
          url: "https://api.example.com/daily-report",
          method: "GET",
        },
        position: { x: 250, y: 250 },
      },
      {
        id: "action-2",
        label: "Send Report Email",
        description: "Email the daily report",
        icon: "mail",
        nodeType: "action",
        config: {
          to: "team@company.com",
          subject: "Daily Report - {{$workflow.timestamp}}",
          body: "Here is your daily summary:\n\n{{$node.action-1.output.data}}",
        },
        position: { x: 250, y: 400 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "action-1" },
      { id: "e2", source: "action-1", target: "action-2" },
    ],
  },
  {
    id: "form-submission",
    name: "Contact Form Handler",
    description: "Process contact form and send confirmation",
    icon: FileText,
    iconColor: "text-indigo-500",
    tags: ["form", "email", "notification"],
    nodes: [
      {
        id: "trigger-1",
        label: "Form Submitted",
        description: "When contact form is submitted",
        icon: "file-text",
        nodeType: "trigger",
        config: {
          formFields: [
            { name: "name", type: "text", required: true },
            { name: "email", type: "email", required: true },
            { name: "message", type: "textarea", required: true },
          ],
        },
        position: { x: 250, y: 100 },
      },
      {
        id: "action-1",
        label: "Send Confirmation",
        description: "Send confirmation to user",
        icon: "mail",
        nodeType: "action",
        config: {
          to: "{{$trigger.data.email}}",
          subject: "We received your message!",
          body: "Hi {{$trigger.data.name}},\n\nThank you for reaching out. We've received your message and will get back to you soon.\n\nYour message:\n{{$trigger.data.message}}",
        },
        position: { x: 150, y: 300 },
      },
      {
        id: "action-2",
        label: "Notify Team",
        description: "Notify team via Slack",
        icon: "message-square",
        nodeType: "action",
        config: {
          channel: "#inquiries",
          message: "📬 New Contact Form Submission\n\nFrom: {{$trigger.data.name}} ({{$trigger.data.email}})\nMessage: {{$trigger.data.message}}",
        },
        position: { x: 350, y: 300 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "action-1" },
      { id: "e2", source: "trigger-1", target: "action-2" },
    ],
  },
];

interface ExampleWorkflowsProps {
  onClose: () => void;
}

export function ExampleWorkflows({ onClose }: ExampleWorkflowsProps) {
  const { importWorkflow } = useFlowStore();
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);

  // Get all unique tags
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    EXAMPLE_WORKFLOWS.forEach((wf) => wf.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, []);

  // Filter workflows by tag
  const filteredWorkflows = React.useMemo(() => {
    if (!selectedTag) return EXAMPLE_WORKFLOWS;
    return EXAMPLE_WORKFLOWS.filter((wf) => wf.tags.includes(selectedTag));
  }, [selectedTag]);

  const handleImport = (workflow: ExampleWorkflow) => {
    // Convert to import format
    const importData = {
      name: workflow.name,
      description: workflow.description,
      nodes: workflow.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        description: n.description,
        icon: n.icon,
        type: n.nodeType,
        config: n.config,
        position: n.position,
      })),
      edges: workflow.edges,
    };

    importWorkflow(JSON.stringify(importData));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Example Workflows
            </h2>
            <p className="text-sm text-muted-foreground">
              Start with a template and customize it for your needs
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tag Filters */}
        <div className="px-4 py-3 border-b border-border flex gap-2 overflow-x-auto">
          <Button
            variant={selectedTag === null ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setSelectedTag(null)}
            className="shrink-0"
          >
            All
          </Button>
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant={selectedTag === tag ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedTag(tag)}
              className="shrink-0 capitalize"
            >
              {tag}
            </Button>
          ))}
        </div>

        {/* Workflow Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWorkflows.map((workflow) => {
              const Icon = workflow.icon;
              return (
                <div
                  key={workflow.id}
                  className="border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => handleImport(workflow)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg bg-muted", workflow.iconColor)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                        {workflow.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {workflow.description}
                      </p>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {workflow.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 bg-muted rounded capitalize"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <span>{workflow.nodes.length} nodes</span>
                        <span>·</span>
                        <span>{workflow.edges.length} connections</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImport(workflow);
                    }}
                  >
                    Use This Template
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Click on any template to import it into your workflow. You can customize it after importing.
          </p>
        </div>
      </div>
    </div>
  );
}
