/**
 * @file index.ts
 * @description Database connection and exports for Drizzle ORM
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the drizzle database instance
export const db = drizzle(pool, { schema });

// Export all schema types and tables
export * from "./schema";
