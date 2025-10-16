-- Workflow Automations Schema for Wholesale CRM
-- This enables automatic task creation and notifications based on status changes

-- Create workflow_rules table
CREATE TABLE IF NOT EXISTS workflow_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50) NOT NULL, -- 'seller', 'property', 'deal', 'task'
  trigger_type VARCHAR(50) NOT NULL, -- 'status_change', 'field_change', 'date_based'
  trigger_condition JSONB, -- { "field": "status", "from": "contacted", "to": "qualified" }
  action_type VARCHAR(50) NOT NULL, -- 'create_task', 'send_email', 'send_sms', 'log_activity'
  action_config JSONB NOT NULL, -- Configuration for the action
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workflow_execution_log table to track when rules fire
CREATE TABLE IF NOT EXISTS workflow_execution_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES workflow_rules(id) ON DELETE CASCADE,
  entity_type VARCHAR(50),
  entity_id UUID,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  action_result JSONB -- What was created/sent
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_rules_entity_type ON workflow_rules(entity_type);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_active ON workflow_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_log_rule_id ON workflow_execution_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_log_entity ON workflow_execution_log(entity_type, entity_id);

-- Insert starter workflow rules
INSERT INTO workflow_rules (name, description, entity_type, trigger_type, trigger_condition, action_type, action_config, is_active) VALUES

-- Seller workflows
('New Seller Follow-up', 'Auto-create follow-up task when seller status changes to contacted', 'seller', 'status_change',
  '{"field": "status", "to": "contacted"}'::jsonb,
  'create_task',
  '{"title": "Follow up with seller", "description": "Call back within 48 hours", "priority": "high", "due_days": 2}'::jsonb,
  true),

('Qualified Seller - Schedule Appointment', 'Create task to schedule property visit when seller is qualified', 'seller', 'status_change',
  '{"field": "status", "to": "qualified"}'::jsonb,
  'create_task',
  '{"title": "Schedule property visit", "description": "Set up appointment to view property", "priority": "urgent", "due_days": 1}'::jsonb,
  true),

-- Property workflows
('New Property Analysis', 'Create task to analyze property when added', 'property', 'status_change',
  '{"field": "status", "to": "evaluating"}'::jsonb,
  'create_task',
  '{"title": "Analyze property deal", "description": "Run comps, estimate repairs, calculate max offer", "priority": "high", "due_days": 1}'::jsonb,
  true),

('Offer Made Follow-up', 'Create follow-up task when offer is made on property', 'property', 'status_change',
  '{"field": "status", "to": "offer_made"}'::jsonb,
  'create_task',
  '{"title": "Follow up on offer", "description": "Check if seller received offer and get response", "priority": "high", "due_days": 2}'::jsonb,
  true),

('Property Under Contract - Find Buyer', 'Create task to find buyer when property goes under contract', 'property', 'status_change',
  '{"field": "status", "to": "under_contract"}'::jsonb,
  'create_task',
  '{"title": "Find end buyer for property", "description": "Broadcast to investor list and find qualified buyer", "priority": "urgent", "due_days": 7}'::jsonb,
  true),

-- Deal workflows
('Deal Under Contract - Prepare Docs', 'Create task to prepare closing documents when deal goes under contract', 'deal', 'status_change',
  '{"field": "status", "to": "under_contract"}'::jsonb,
  'create_task',
  '{"title": "Prepare closing documents", "description": "Get assignment contract, title work, and closing docs ready", "priority": "urgent", "due_days": 3}'::jsonb,
  true),

('Deal Closing Soon', 'Create reminder task 3 days before deal closing date', 'deal', 'date_based',
  '{"field": "closing_date", "days_before": 3}'::jsonb,
  'create_task',
  '{"title": "Deal closing in 3 days", "description": "Confirm all parties, verify wire instructions, final walkthrough", "priority": "urgent", "due_days": 0}'::jsonb,
  true),

-- Task workflows
('Overdue Task Escalation', 'Create high-priority task when task is overdue by 3 days', 'task', 'date_based',
  '{"field": "due_date", "days_overdue": 3}'::jsonb,
  'create_task',
  '{"title": "OVERDUE: Escalation needed", "description": "This task is 3+ days overdue - immediate action required", "priority": "urgent", "due_days": 0}'::jsonb,
  false); -- Disabled by default to avoid spam

COMMENT ON TABLE workflow_rules IS 'Defines automation rules that trigger actions based on entity changes';
COMMENT ON TABLE workflow_execution_log IS 'Logs every time a workflow rule executes for auditing';
