/**
 * @file schema.ts
 * @description Drizzle ORM database schema for FlowForge AI
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
  varchar,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  workflows: many(workflows),
  sessions: many(sessions),
}));

// ============================================================================
// SESSIONS TABLE
// ============================================================================

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("sessions_token_idx").on(table.token),
  index("sessions_user_id_idx").on(table.userId),
]);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// WORKFLOWS TABLE
// ============================================================================

export const workflows = pgTable("workflows", {
  id: uuid("id").defaultRandom().primaryKey(),
  // userId is nullable - allows anonymous workflows
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  // anonymousId tracks workflows created before login (browser session ID)
  anonymousId: varchar("anonymous_id", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, active, paused
  nodes: jsonb("nodes").notNull().default([]),
  edges: jsonb("edges").notNull().default([]),
  nodeCount: integer("node_count").notNull().default(0),
  executionCount: integer("execution_count").notNull().default(0),
  successRate: integer("success_rate"),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  // Link to conversation for workflow-specific chat
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  lastMessageId: uuid("last_message_id").references(() => messages.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("workflows_user_id_idx").on(table.userId),
  index("workflows_anonymous_id_idx").on(table.anonymousId),
  index("workflows_conversation_id_idx").on(table.conversationId),
]);

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  user: one(users, {
    fields: [workflows.userId],
    references: [users.id],
  }),
  executions: many(executions),
  versions: many(workflowVersions),
  conversation: one(conversations, {
    fields: [workflows.conversationId],
    references: [conversations.id],
  }),
}));

// ============================================================================
// EXECUTIONS TABLE
// ============================================================================

export const executions = pgTable("executions", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, running, completed, failed
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  duration: integer("duration"), // in milliseconds
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("executions_workflow_id_idx").on(table.workflowId),
]);

export const executionsRelations = relations(executions, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [executions.workflowId],
    references: [workflows.id],
  }),
  steps: many(executionSteps),
}));

// ============================================================================
// EXECUTION STEPS TABLE
// ============================================================================

export const executionSteps = pgTable("execution_steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  executionId: uuid("execution_id")
    .notNull()
    .references(() => executions.id, { onDelete: "cascade" }),
  nodeId: varchar("node_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // trigger, action, condition, delay, loop
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, running, completed, failed, skipped
  duration: integer("duration"), // in milliseconds
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  inputSummary: text("input_summary"),
  outputSummary: text("output_summary"),
  error: text("error"),
  stepOrder: integer("step_order").notNull().default(0),
}, (table) => [
  index("execution_steps_execution_id_idx").on(table.executionId),
]);

export const executionStepsRelations = relations(executionSteps, ({ one }) => ({
  execution: one(executions, {
    fields: [executionSteps.executionId],
    references: [executions.id],
  }),
}));

// ============================================================================
// CONVERSATIONS TABLE (Chat History)
// ============================================================================

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  anonymousId: varchar("anonymous_id", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull().default("New Conversation"),
  // Tambo thread ID for loading historical messages
  tamboThreadId: varchar("tambo_thread_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("conversations_user_id_idx").on(table.userId),
  index("conversations_anonymous_id_idx").on(table.anonymousId),
  index("conversations_tambo_thread_id_idx").on(table.tamboThreadId),
]);

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
  versions: many(workflowVersions),
}));

// ============================================================================
// MESSAGES TABLE
// ============================================================================

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // user, assistant
  content: text("content").notNull(),
  // Store rendered components as JSON
  components: jsonb("components"),
  // Store additional metadata (workflowId, snapshot, changes, tamboThreadId)
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("messages_conversation_id_idx").on(table.conversationId),
  index("messages_created_at_idx").on(table.createdAt),
]);

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  versions: many(workflowVersions),
}));

// ============================================================================
// USER INTEGRATIONS TABLE (Linked accounts like Slack, Email, etc.)
// ============================================================================

export const integrations = pgTable("integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // slack, email, discord, teams, webhook
  name: varchar("name", { length: 255 }).notNull(), // User-friendly name like "My Slack Workspace"
  // Encrypted credentials stored as text (format: iv:authTag:ciphertext)
  encryptedConfig: text("encrypted_config").notNull(),
  // Key version for key rotation
  keyVersion: integer("key_version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("integrations_user_id_idx").on(table.userId),
  index("integrations_type_idx").on(table.type),
]);

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// PLATFORM USAGE TABLE (Track platform-provided resource usage)
// ============================================================================

export const platformUsage = pgTable("platform_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // 'email', 'ai_tokens', etc.
  usageCount: integer("usage_count").notNull().default(0),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("platform_usage_user_resource_idx").on(table.userId, table.resourceType, table.periodStart),
]);

export const platformUsageRelations = relations(platformUsage, ({ one }) => ({
  user: one(users, {
    fields: [platformUsage.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// WORKFLOW VERSIONS TABLE (Version History for Rollback)
// ============================================================================

export const workflowVersions = pgTable("workflow_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),

  // Snapshot data
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
  nodeCount: integer("node_count").notNull().default(0),

  // Change metadata
  changeDescription: text("change_description"),
  changeType: varchar("change_type", { length: 50 }), // node_added, node_removed, edge_added, etc.
  changedBy: varchar("changed_by", { length: 20 }).notNull().default("user"), // user or ai

  // Timing
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("workflow_versions_workflow_id_idx").on(table.workflowId, table.createdAt),
  index("workflow_versions_message_id_idx").on(table.messageId),
  index("workflow_versions_conversation_id_idx").on(table.conversationId),
]);

export const workflowVersionsRelations = relations(workflowVersions, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowVersions.workflowId],
    references: [workflows.id],
  }),
  conversation: one(conversations, {
    fields: [workflowVersions.conversationId],
    references: [conversations.id],
  }),
  message: one(messages, {
    fields: [workflowVersions.messageId],
    references: [messages.id],
  }),
}));

// ============================================================================
// TEMPLATES TABLE
// ============================================================================

export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  popularity: integer("popularity").notNull().default(0),
  nodes: jsonb("nodes").notNull().default([]),
  edges: jsonb("edges").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;

export type Execution = typeof executions.$inferSelect;
export type NewExecution = typeof executions.$inferInsert;

export type ExecutionStep = typeof executionSteps.$inferSelect;
export type NewExecutionStep = typeof executionSteps.$inferInsert;

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;

export type WorkflowVersion = typeof workflowVersions.$inferSelect;
export type NewWorkflowVersion = typeof workflowVersions.$inferInsert;

// ============================================================================
// WEBHOOK TRIGGERS TABLE
// ============================================================================

export const webhookTriggers = pgTable("webhook_triggers", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),
  nodeId: varchar("node_id", { length: 255 }).notNull(),
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // 'webhook', 'event', 'form_submit', 'schedule'
  webhookUrl: text("webhook_url").notNull(),
  // URL token - embedded in the URL for simple auth
  webhookToken: varchar("webhook_token", { length: 64 }).notNull().unique(),
  // Bearer token - for Authorization header auth (different from URL token)
  bearerToken: varchar("bearer_token", { length: 64 }),
  // HMAC secret - for signature verification (separate secret)
  hmacSecret: varchar("hmac_secret", { length: 64 }),
  // Selected auth method
  authMethod: varchar("auth_method", { length: 20 }).notNull().default("url_token"), // url_token, bearer, hmac
  config: jsonb("config"), // Schedule cron, event filters, etc.
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("webhook_triggers_workflow_id_idx").on(table.workflowId),
  index("webhook_triggers_token_idx").on(table.webhookToken),
  index("webhook_triggers_bearer_token_idx").on(table.bearerToken),
]);

export const webhookTriggersRelations = relations(webhookTriggers, ({ one }) => ({
  workflow: one(workflows, {
    fields: [webhookTriggers.workflowId],
    references: [workflows.id],
  }),
}));

export type WebhookTrigger = typeof webhookTriggers.$inferSelect;
export type NewWebhookTrigger = typeof webhookTriggers.$inferInsert;

// ============================================================================
// API KEYS TABLE
// ============================================================================

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  // First 8 chars of the key for display (e.g., "ff_abc123...")
  keyPrefix: varchar("key_prefix", { length: 12 }).notNull(),
  // SHA-256 hash of the full key for secure comparison
  hashedKey: text("hashed_key").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  // Scopes for fine-grained permissions (e.g., ["workflow:trigger", "workflow:read"])
  scopes: jsonb("scopes").notNull().default(["workflow:trigger"]),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("api_keys_user_id_idx").on(table.userId),
  index("api_keys_hashed_key_idx").on(table.hashedKey),
]);

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
