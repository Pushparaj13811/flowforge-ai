/**
 * @file define-trigger-schema.ts
 * @description Tool for defining expected trigger data schema
 * Enables AI to understand and communicate what data a trigger will receive
 */

import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";

/**
 * Schema for a trigger field definition
 */
const triggerFieldSchema = z.object({
  name: z.string().describe("Field name (e.g., 'email', 'amount', 'orderId')"),
  type: z.enum(["string", "number", "boolean", "object", "array", "date", "email", "url", "phone"])
    .describe("Data type of the field"),
  description: z.string().optional().describe("Human-readable description of the field"),
  required: z.boolean().default(true).describe("Whether this field is required"),
  exampleJson: z.string().optional().describe("Example value for this field as JSON string"),
});

/**
 * Common trigger field templates
 */
const COMMON_FIELD_TEMPLATES: Record<string, z.infer<typeof triggerFieldSchema>[]> = {
  "contact-form": [
    { name: "name", type: "string", description: "Contact's full name", required: true, exampleJson: '"John Doe"' },
    { name: "email", type: "email", description: "Contact's email address", required: true, exampleJson: '"john@example.com"' },
    { name: "message", type: "string", description: "Message content", required: true, exampleJson: '"Hello, I\'d like to..."' },
    { name: "phone", type: "phone", description: "Contact's phone number", required: false, exampleJson: '"+1234567890"' },
  ],
  "order": [
    { name: "orderId", type: "string", description: "Unique order identifier", required: true, exampleJson: '"ORD-12345"' },
    { name: "amount", type: "number", description: "Order total in cents", required: true, exampleJson: "4999" },
    { name: "currency", type: "string", description: "Currency code", required: true, exampleJson: '"usd"' },
    { name: "customerEmail", type: "email", description: "Customer's email", required: true, exampleJson: '"customer@example.com"' },
    { name: "items", type: "array", description: "List of order items", required: true, exampleJson: "[]" },
  ],
  "payment": [
    { name: "paymentId", type: "string", description: "Payment identifier", required: true, exampleJson: '"pi_xxxxx"' },
    { name: "amount", type: "number", description: "Payment amount in cents", required: true, exampleJson: "2500" },
    { name: "status", type: "string", description: "Payment status", required: true, exampleJson: '"succeeded"' },
    { name: "customerEmail", type: "email", description: "Customer's email", required: true, exampleJson: '"customer@example.com"' },
  ],
  "user-signup": [
    { name: "userId", type: "string", description: "New user's ID", required: true, exampleJson: '"usr_xxxxx"' },
    { name: "email", type: "email", description: "User's email address", required: true, exampleJson: '"newuser@example.com"' },
    { name: "name", type: "string", description: "User's display name", required: false, exampleJson: '"Jane Smith"' },
    { name: "createdAt", type: "date", description: "Account creation timestamp", required: true, exampleJson: '"2024-01-15T10:30:00Z"' },
  ],
  "webhook-generic": [
    { name: "event", type: "string", description: "Event type", required: true, exampleJson: '"data.created"' },
    { name: "data", type: "object", description: "Event payload", required: true, exampleJson: "{}" },
    { name: "timestamp", type: "date", description: "Event timestamp", required: true, exampleJson: '"2024-01-15T10:30:00Z"' },
  ],
};

/**
 * Define Trigger Schema Tool
 */
export const defineTriggerSchemaTool: TamboTool = {
  name: "defineTriggerSchema",
  description: `Define what data fields a workflow trigger will receive.

Use this to:
- Help users specify what data their webhooks will receive
- Generate variable suggestions for downstream nodes
- Create form field definitions for form triggers
- Document expected payload structures

This makes variables like {{$trigger.data.fieldName}} available in later workflow steps.

Includes templates for common use cases:
- contact-form: name, email, message, phone
- order: orderId, amount, currency, customerEmail, items
- payment: paymentId, amount, status, customerEmail
- user-signup: userId, email, name, createdAt
- webhook-generic: event, data, timestamp`,

  tool: async (input: {
    triggerId: string;
    fields: z.infer<typeof triggerFieldSchema>[];
    triggerType?: string;
    useTemplate?: string;
  }) => {
    const { triggerId, fields, triggerType = "webhook", useTemplate } = input;

    // If using a template, merge with provided fields
    let finalFields = [...fields];
    if (useTemplate && COMMON_FIELD_TEMPLATES[useTemplate]) {
      const templateFields = COMMON_FIELD_TEMPLATES[useTemplate];
      // Add template fields that aren't already defined
      for (const templateField of templateFields) {
        if (!finalFields.some((f) => f.name === templateField.name)) {
          finalFields.push(templateField);
        }
      }
    }

    // Generate variable paths for each field
    const variablePaths = finalFields.map((field) => ({
      field: field.name,
      path: `$trigger.data.${field.name}`,
      type: field.type,
      description: field.description,
      exampleJson: field.exampleJson,
    }));

    // Generate sample data
    const sampleData: Record<string, unknown> = {};
    for (const field of finalFields) {
      if (field.exampleJson !== undefined) {
        try {
          sampleData[field.name] = JSON.parse(field.exampleJson);
        } catch {
          sampleData[field.name] = field.exampleJson;
        }
      } else {
        // Generate default example based on type
        switch (field.type) {
          case "string":
            sampleData[field.name] = `sample_${field.name}`;
            break;
          case "number":
            sampleData[field.name] = 100;
            break;
          case "boolean":
            sampleData[field.name] = true;
            break;
          case "email":
            sampleData[field.name] = "user@example.com";
            break;
          case "url":
            sampleData[field.name] = "https://example.com";
            break;
          case "phone":
            sampleData[field.name] = "+1234567890";
            break;
          case "date":
            sampleData[field.name] = new Date().toISOString();
            break;
          case "object":
            sampleData[field.name] = {};
            break;
          case "array":
            sampleData[field.name] = [];
            break;
        }
      }
    }

    return {
      success: true,
      triggerId,
      triggerType,
      fields: finalFields,
      variablePaths,
      sampleDataJson: JSON.stringify(sampleData),
      templateUsed: useTemplate || null,
      message: `Defined ${finalFields.length} fields for trigger. Available variables: ${variablePaths.map((v) => v.path).join(", ")}`,
    };
  },

  inputSchema: z.object({
    triggerId: z.string().describe("ID of the trigger node to define schema for"),
    fields: z.array(triggerFieldSchema).describe("Array of field definitions"),
    triggerType: z.enum(["webhook", "form", "schedule", "event", "manual"]).optional()
      .describe("Type of trigger"),
    useTemplate: z.enum(["contact-form", "order", "payment", "user-signup", "webhook-generic"]).optional()
      .describe("Use a predefined template as base"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    triggerId: z.string(),
    triggerType: z.string(),
    fields: z.array(triggerFieldSchema),
    variablePaths: z.array(z.object({
      field: z.string(),
      path: z.string(),
      type: z.string(),
      description: z.string().optional(),
      exampleJson: z.string().optional(),
    })),
    sampleDataJson: z.string().describe("Sample data as JSON string"),
    templateUsed: z.string().nullable(),
    message: z.string(),
  }),
};

/**
 * Get available templates for trigger schemas
 */
export function getTriggerSchemaTemplates(): Record<string, z.infer<typeof triggerFieldSchema>[]> {
  return COMMON_FIELD_TEMPLATES;
}

/**
 * Generate sample data from trigger schema
 */
export function generateSampleDataFromSchema(
  fields: z.infer<typeof triggerFieldSchema>[]
): Record<string, unknown> {
  const sampleData: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.exampleJson !== undefined) {
      try {
        sampleData[field.name] = JSON.parse(field.exampleJson);
      } catch {
        sampleData[field.name] = field.exampleJson;
      }
    } else {
      switch (field.type) {
        case "string":
          sampleData[field.name] = `sample_${field.name}`;
          break;
        case "number":
          sampleData[field.name] = 100;
          break;
        case "boolean":
          sampleData[field.name] = true;
          break;
        case "email":
          sampleData[field.name] = "user@example.com";
          break;
        case "url":
          sampleData[field.name] = "https://example.com";
          break;
        case "phone":
          sampleData[field.name] = "+1234567890";
          break;
        case "date":
          sampleData[field.name] = new Date().toISOString();
          break;
        case "object":
          sampleData[field.name] = {};
          break;
        case "array":
          sampleData[field.name] = [];
          break;
      }
    }
  }

  return sampleData;
}
