/**
 * @file demo-data.ts
 * @description Demo data for workflow templates
 */

export interface WorkflowTemplateNode {
  id: string;
  label: string;
  description?: string;
  type: "trigger" | "action" | "condition" | "delay" | "loop";
  icon?: string;
  config?: Record<string, unknown>;
  position?: { x: number; y: number };
}

export interface WorkflowTemplateEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  popularity: number;
  nodes: WorkflowTemplateNode[];
  edges: WorkflowTemplateEdge[];
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "welcome-email",
    name: "Welcome Email Sequence",
    description: "Send a welcome email when a new user signs up, with a follow-up after 24 hours.",
    category: "Marketing",
    icon: "mail",
    popularity: 95,
    nodes: [
      {
        id: "trigger-1",
        label: "User Signup",
        description: "When a new user registers",
        type: "trigger",
        icon: "webhook",
        config: {},
        position: { x: 250, y: 50 },
      },
      {
        id: "action-1",
        label: "Send Welcome Email",
        description: "Send personalized welcome message",
        type: "action",
        icon: "mail",
        config: {
          to: "{{$trigger.data.email}}",
          subject: "Welcome to our platform!",
          body: "Hi {{$trigger.data.name}}, welcome aboard!",
        },
        position: { x: 250, y: 200 },
      },
      {
        id: "delay-1",
        label: "Wait 24 Hours",
        description: "Pause before follow-up",
        type: "delay",
        icon: "clock",
        config: { duration: 86400, unit: "seconds" },
        position: { x: 250, y: 350 },
      },
      {
        id: "action-2",
        label: "Send Follow-up Email",
        description: "Check in with the new user",
        type: "action",
        icon: "mail",
        config: {
          to: "{{$trigger.data.email}}",
          subject: "How's it going?",
          body: "Just checking in to see if you need any help getting started.",
        },
        position: { x: 250, y: 500 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "action-1" },
      { id: "e2", source: "action-1", target: "delay-1" },
      { id: "e3", source: "delay-1", target: "action-2" },
    ],
  },
  {
    id: "order-notification",
    name: "Order Notification",
    description: "Notify team on Slack when a new order is placed and send confirmation to customer.",
    category: "Sales",
    icon: "message-square",
    popularity: 92,
    nodes: [
      {
        id: "trigger-1",
        label: "New Order",
        description: "When an order is placed",
        type: "trigger",
        icon: "webhook",
        config: {},
        position: { x: 250, y: 50 },
      },
      {
        id: "action-1",
        label: "Notify Slack",
        description: "Post to #orders channel",
        type: "action",
        icon: "message-square",
        config: {
          channel: "#orders",
          message: "New order from {{$trigger.data.customerName}} - ${{$trigger.data.amount}}",
        },
        position: { x: 100, y: 200 },
      },
      {
        id: "action-2",
        label: "Send Confirmation",
        description: "Email confirmation to customer",
        type: "action",
        icon: "mail",
        config: {
          to: "{{$trigger.data.email}}",
          subject: "Order Confirmed",
          body: "Thank you for your order!",
        },
        position: { x: 400, y: 200 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "action-1" },
      { id: "e2", source: "trigger-1", target: "action-2" },
    ],
  },
  {
    id: "high-value-alert",
    name: "High-Value Order Alert",
    description: "Route high-value orders to VIP team and standard orders to regular processing.",
    category: "Sales",
    icon: "git-branch",
    popularity: 88,
    nodes: [
      {
        id: "trigger-1",
        label: "New Order",
        description: "When an order is placed",
        type: "trigger",
        icon: "webhook",
        config: {},
        position: { x: 250, y: 50 },
      },
      {
        id: "condition-1",
        label: "Check Amount",
        description: "Is order over $500?",
        type: "condition",
        icon: "git-branch",
        config: {
          field: "$trigger.data.amount",
          operator: "greater_than",
          value: "500",
        },
        position: { x: 250, y: 200 },
      },
      {
        id: "action-1",
        label: "VIP Alert",
        description: "Notify VIP team",
        type: "action",
        icon: "message-square",
        config: {
          channel: "#vip-orders",
          message: "High-value order: ${{$trigger.data.amount}}",
        },
        position: { x: 100, y: 350 },
      },
      {
        id: "action-2",
        label: "Standard Process",
        description: "Regular order flow",
        type: "action",
        icon: "mail",
        config: {
          to: "orders@company.com",
          subject: "New Order",
          body: "Process order {{$trigger.data.orderId}}",
        },
        position: { x: 400, y: 350 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "condition-1" },
      { id: "e2", source: "condition-1", target: "action-1", sourceHandle: "yes" },
      { id: "e3", source: "condition-1", target: "action-2", sourceHandle: "no" },
    ],
  },
  {
    id: "daily-digest",
    name: "Daily Digest Email",
    description: "Send a daily summary email at 9 AM with key metrics and updates.",
    category: "Operations",
    icon: "clock",
    popularity: 85,
    nodes: [
      {
        id: "trigger-1",
        label: "Daily at 9 AM",
        description: "Scheduled trigger",
        type: "trigger",
        icon: "clock",
        config: { cron: "0 9 * * *", timezone: "America/New_York" },
        position: { x: 250, y: 50 },
      },
      {
        id: "action-1",
        label: "Fetch Metrics",
        description: "Get daily data from API",
        type: "action",
        icon: "database",
        config: { url: "https://api.example.com/metrics" },
        position: { x: 250, y: 200 },
      },
      {
        id: "action-2",
        label: "Send Digest",
        description: "Email daily summary",
        type: "action",
        icon: "mail",
        config: {
          to: "team@company.com",
          subject: "Daily Digest",
          body: "Today's metrics summary...",
        },
        position: { x: 250, y: 350 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "action-1" },
      { id: "e2", source: "action-1", target: "action-2" },
    ],
  },
  {
    id: "support-ticket",
    name: "Support Ticket Handler",
    description: "Create support ticket, notify team, and send acknowledgment to customer.",
    category: "Support",
    icon: "bell",
    popularity: 90,
    nodes: [
      {
        id: "trigger-1",
        label: "New Ticket",
        description: "Support form submission",
        type: "trigger",
        icon: "webhook",
        config: {},
        position: { x: 250, y: 50 },
      },
      {
        id: "action-1",
        label: "Create Ticket",
        description: "Add to support system",
        type: "action",
        icon: "database",
        config: {},
        position: { x: 250, y: 200 },
      },
      {
        id: "action-2",
        label: "Notify Support",
        description: "Alert support team",
        type: "action",
        icon: "message-square",
        config: { channel: "#support" },
        position: { x: 100, y: 350 },
      },
      {
        id: "action-3",
        label: "Send Acknowledgment",
        description: "Confirm to customer",
        type: "action",
        icon: "mail",
        config: { to: "{{$trigger.data.email}}" },
        position: { x: 400, y: 350 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "action-1" },
      { id: "e2", source: "action-1", target: "action-2" },
      { id: "e3", source: "action-1", target: "action-3" },
    ],
  },
  {
    id: "invoice-automation",
    name: "Invoice Automation",
    description: "Generate and send invoices with payment reminders for overdue accounts.",
    category: "Finance",
    icon: "database",
    popularity: 82,
    nodes: [
      {
        id: "trigger-1",
        label: "End of Month",
        description: "Monthly schedule",
        type: "trigger",
        icon: "clock",
        config: { cron: "0 0 1 * *" },
        position: { x: 250, y: 50 },
      },
      {
        id: "action-1",
        label: "Generate Invoice",
        description: "Create invoice document",
        type: "action",
        icon: "database",
        config: {},
        position: { x: 250, y: 200 },
      },
      {
        id: "action-2",
        label: "Send Invoice",
        description: "Email to customer",
        type: "action",
        icon: "mail",
        config: {},
        position: { x: 250, y: 350 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "action-1" },
      { id: "e2", source: "action-1", target: "action-2" },
    ],
  },
  {
    id: "lead-scoring",
    name: "Lead Scoring & Routing",
    description: "Score incoming leads and route to appropriate sales rep based on score.",
    category: "Sales",
    icon: "git-branch",
    popularity: 87,
    nodes: [
      {
        id: "trigger-1",
        label: "New Lead",
        description: "Lead form submission",
        type: "trigger",
        icon: "webhook",
        config: {},
        position: { x: 250, y: 50 },
      },
      {
        id: "action-1",
        label: "Score Lead",
        description: "Calculate lead score",
        type: "action",
        icon: "database",
        config: {},
        position: { x: 250, y: 200 },
      },
      {
        id: "condition-1",
        label: "High Score?",
        description: "Score > 80?",
        type: "condition",
        icon: "git-branch",
        config: { field: "$node.action-1.score", operator: "greater_than", value: "80" },
        position: { x: 250, y: 350 },
      },
      {
        id: "action-2",
        label: "Assign Senior Rep",
        description: "Route to senior sales",
        type: "action",
        icon: "message-square",
        config: { channel: "#senior-sales" },
        position: { x: 100, y: 500 },
      },
      {
        id: "action-3",
        label: "Standard Queue",
        description: "Add to regular queue",
        type: "action",
        icon: "message-square",
        config: { channel: "#sales" },
        position: { x: 400, y: 500 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "action-1" },
      { id: "e2", source: "action-1", target: "condition-1" },
      { id: "e3", source: "condition-1", target: "action-2", sourceHandle: "yes" },
      { id: "e4", source: "condition-1", target: "action-3", sourceHandle: "no" },
    ],
  },
  {
    id: "onboarding-sequence",
    name: "Customer Onboarding",
    description: "Multi-step onboarding sequence with scheduled check-ins and resource delivery.",
    category: "Marketing",
    icon: "mail",
    popularity: 91,
    nodes: [
      {
        id: "trigger-1",
        label: "New Customer",
        description: "Account created",
        type: "trigger",
        icon: "webhook",
        config: {},
        position: { x: 250, y: 50 },
      },
      {
        id: "action-1",
        label: "Welcome Email",
        description: "Send welcome message",
        type: "action",
        icon: "mail",
        config: {},
        position: { x: 250, y: 200 },
      },
      {
        id: "delay-1",
        label: "Wait 3 Days",
        description: "Allow time to explore",
        type: "delay",
        icon: "clock",
        config: { duration: 259200 },
        position: { x: 250, y: 350 },
      },
      {
        id: "action-2",
        label: "Send Resources",
        description: "Getting started guide",
        type: "action",
        icon: "mail",
        config: {},
        position: { x: 250, y: 500 },
      },
    ],
    edges: [
      { id: "e1", source: "trigger-1", target: "action-1" },
      { id: "e2", source: "action-1", target: "delay-1" },
      { id: "e3", source: "delay-1", target: "action-2" },
    ],
  },
];
