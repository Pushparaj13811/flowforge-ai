-- Migration: Add encrypted_config column and key_version to integrations table
-- Date: 2026-02-04
-- Description: Replace plaintext config JSONB with encrypted text field

-- Step 1: Add new encrypted_config column
ALTER TABLE integrations ADD COLUMN encrypted_config TEXT;

-- Step 2: Add key_version column
ALTER TABLE integrations ADD COLUMN key_version INTEGER NOT NULL DEFAULT 1;

-- Step 3: Drop the old config column (WARNING: This will delete existing data)
-- Uncomment the line below after you've migrated existing credentials
-- ALTER TABLE integrations DROP COLUMN config;

-- Step 4: Make encrypted_config NOT NULL after migration
-- Uncomment after migrating existing data
-- ALTER TABLE integrations ALTER COLUMN encrypted_config SET NOT NULL;
