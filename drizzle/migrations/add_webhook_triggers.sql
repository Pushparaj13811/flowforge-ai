-- Migration: Add webhook_triggers table
-- Description: Store webhook triggers for workflow nodes

CREATE TABLE IF NOT EXISTS webhook_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  node_id VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_token VARCHAR(64) NOT NULL UNIQUE,
  config JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX webhook_triggers_workflow_id_idx ON webhook_triggers(workflow_id);
CREATE INDEX webhook_triggers_token_idx ON webhook_triggers(webhook_token);
