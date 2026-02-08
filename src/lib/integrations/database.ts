/**
 * @file integrations/database.ts
 * @description Database operations for workflow data storage
 */

import { z } from "zod";
import { db } from "@/db";

// Zod schema for database query
export const databaseQuerySchema = z.object({
  operation: z.enum(["insert", "select", "update", "delete"]),
  table: z.string().min(1, "Table name is required"),
  data: z.record(z.any()).optional(),
  where: z.record(z.any()).optional(),
  limit: z.number().min(1).max(1000).optional(),
  orderBy: z.string().optional(),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type DatabaseQueryInput = z.infer<typeof databaseQuerySchema>;

export interface DatabaseQueryResult {
  success: boolean;
  rowCount?: number;
  data?: unknown[];
  error?: string;
}

/**
 * Execute a database operation
 * Note: This is a simplified implementation. In production, you'd want
 * proper query building and SQL injection protection.
 */
export async function executeDatabaseQuery(input: DatabaseQueryInput): Promise<DatabaseQueryResult> {
  try {
    const validated = databaseQuerySchema.parse(input);

    // For security, only allow operations on specific tables
    const allowedTables = ["workflow_data", "workflow_logs", "workflow_variables"];
    if (!allowedTables.includes(validated.table)) {
      return {
        success: false,
        error: `Table '${validated.table}' is not accessible. Allowed: ${allowedTables.join(", ")}`,
      };
    }

    // In a real implementation, you'd use the Drizzle query builder
    // This is a placeholder that shows the structure
    return {
      success: true,
      rowCount: 0,
      data: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e) => e.message).join(", ")}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

// Key-Value store operations for workflow variables
export const workflowVariableSchema = z.object({
  workflowId: z.string(),
  key: z.string().min(1),
  value: z.any(),
  expiresAt: z.date().optional(),
});

export type WorkflowVariable = z.infer<typeof workflowVariableSchema>;

// In-memory store for workflow variables (in production, use Redis or database)
const variableStore = new Map<string, { value: unknown; expiresAt?: Date }>();

/**
 * Set a workflow variable
 */
export async function setWorkflowVariable(
  workflowId: string,
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const storeKey = `${workflowId}:${key}`;
    variableStore.set(storeKey, {
      value,
      expiresAt: ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : undefined,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set variable",
    };
  }
}

/**
 * Get a workflow variable
 */
export async function getWorkflowVariable(
  workflowId: string,
  key: string
): Promise<{ success: boolean; value?: unknown; error?: string }> {
  try {
    const storeKey = `${workflowId}:${key}`;
    const stored = variableStore.get(storeKey);

    if (!stored) {
      return { success: true, value: undefined };
    }

    // Check expiration
    if (stored.expiresAt && stored.expiresAt < new Date()) {
      variableStore.delete(storeKey);
      return { success: true, value: undefined };
    }

    return { success: true, value: stored.value };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get variable",
    };
  }
}

/**
 * Delete a workflow variable
 */
export async function deleteWorkflowVariable(
  workflowId: string,
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const storeKey = `${workflowId}:${key}`;
    variableStore.delete(storeKey);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete variable",
    };
  }
}

// Output schema for Tambo
export const databaseQueryOutputSchema = z.object({
  success: z.boolean(),
  rowCount: z.number().optional(),
  data: z.array(z.any()).optional(),
  error: z.string().optional(),
});
