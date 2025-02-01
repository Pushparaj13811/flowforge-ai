/**
 * @file seed.ts
 * @description Database seed script for FlowForge AI
 *
 * Run with: npx tsx src/db/seed.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { templates } from "./schema";

// Load environment variables
dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

// Template data from demo-data.ts
const templateData = [
  {
    name: "Lead Notification",
    description: "Get instant Slack alerts when new leads come in",
    category: "Sales",
    icon: "message-square",
    popularity: 95,
    nodes: [
      { id: "n1", type: "trigger", label: "New Lead", icon: "webhook", position: { x: 250, y: 50 } },
      { id: "n2", type: "action", label: "Send Slack Message", icon: "message-square", position: { x: 250, y: 180 } },
    ],
    edges: [{ id: "e1", source: "n1", target: "n2" }],
  },
  {
    name: "Welcome Email Series",
    description: "Onboard new users with automated email sequence",
    category: "Marketing",
    icon: "mail",
    popularity: 88,
    nodes: [
      { id: "n1", type: "trigger", label: "User Signup", icon: "webhook", position: { x: 250, y: 50 } },
      { id: "n2", type: "action", label: "Welcome Email", icon: "mail", position: { x: 250, y: 180 } },
      { id: "n3", type: "delay", label: "Wait 3 Days", icon: "clock", position: { x: 250, y: 310 } },
      { id: "n4", type: "action", label: "Follow-up Email", icon: "mail", position: { x: 250, y: 440 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
    ],
  },
  {
    name: "Daily Report",
    description: "Generate and send daily business reports",
    category: "Operations",
    icon: "clock",
    popularity: 76,
    nodes: [
      { id: "n1", type: "trigger", label: "Schedule (9 AM)", icon: "clock", position: { x: 250, y: 50 } },
      { id: "n2", type: "action", label: "Fetch Data", icon: "database", position: { x: 250, y: 180 } },
      { id: "n3", type: "action", label: "Send Report", icon: "mail", position: { x: 250, y: 310 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
    ],
  },
  {
    name: "Customer Feedback Loop",
    description: "Collect and route customer feedback automatically",
    category: "Support",
    icon: "bell",
    popularity: 72,
    nodes: [
      { id: "n1", type: "trigger", label: "Feedback Received", icon: "webhook", position: { x: 250, y: 50 } },
      { id: "n2", type: "condition", label: "Check Sentiment", icon: "filter", position: { x: 250, y: 180 } },
      { id: "n3", type: "action", label: "Alert Support", icon: "bell", position: { x: 100, y: 310 } },
      { id: "n4", type: "action", label: "Send Thank You", icon: "mail", position: { x: 400, y: 310 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3", label: "Negative" },
      { id: "e3", source: "n2", target: "n4", label: "Positive" },
    ],
  },
  {
    name: "Data Sync",
    description: "Keep your systems in sync automatically",
    category: "Operations",
    icon: "repeat",
    popularity: 68,
    nodes: [
      { id: "n1", type: "trigger", label: "Record Updated", icon: "database", position: { x: 250, y: 50 } },
      { id: "n2", type: "loop", label: "For Each System", icon: "repeat", position: { x: 250, y: 180 } },
      { id: "n3", type: "action", label: "Sync Data", icon: "cog", position: { x: 250, y: 310 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
    ],
  },
  {
    name: "Invoice Processing",
    description: "Automatically process and route incoming invoices",
    category: "Finance",
    icon: "database",
    popularity: 65,
    nodes: [
      { id: "n1", type: "trigger", label: "Invoice Received", icon: "mail", position: { x: 250, y: 50 } },
      { id: "n2", type: "action", label: "Extract Data", icon: "cog", position: { x: 250, y: 180 } },
      { id: "n3", type: "condition", label: "Needs Approval?", icon: "filter", position: { x: 250, y: 310 } },
      { id: "n4", type: "action", label: "Request Approval", icon: "bell", position: { x: 100, y: 440 } },
      { id: "n5", type: "action", label: "Process Payment", icon: "database", position: { x: 400, y: 440 } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4", label: "Yes" },
      { id: "e4", source: "n3", target: "n5", label: "No" },
    ],
  },
];

async function seed() {
  console.log("Seeding database...");

  try {
    // Clear existing templates
    await db.delete(templates);
    console.log("Cleared existing templates");

    // Insert templates
    for (const template of templateData) {
      await db.insert(templates).values({
        name: template.name,
        description: template.description,
        category: template.category,
        icon: template.icon,
        popularity: template.popularity,
        nodes: template.nodes,
        edges: template.edges,
      });
      console.log(`Inserted template: ${template.name}`);
    }

    console.log("\nSeeding completed successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
