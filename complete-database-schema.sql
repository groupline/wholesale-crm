-- ============================================================
-- COMPLETE WHOLESALE CRM DATABASE SCHEMA
-- Version: 2.0.0
-- Updated: 2025-10-16
-- ============================================================
-- Run this entire file in Supabase SQL Editor to create all tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- NEW FEATURE TABLES (Create these first)
-- ============================================================

-- 1. MARKETING CAMPAIGNS
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(100) NOT NULL, -- 'direct_mail', 'ppc', 'cold_calling', 'bandit_signs', 'seo', 'social_media', etc.
  budget DECIMAL(12,2) DEFAULT 0,
  actual_spent DECIMAL(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_channel ON marketing_campaigns(channel);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);

-- 2. EMAIL TEMPLATES
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- 'seller_followup', 'investor_broadcast', 'offer_letter', etc.
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names like ["seller_name", "property_address"]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Starter email templates
INSERT INTO email_templates (name, category, subject, body, variables) VALUES
('Seller Follow-up #1', 'seller_followup', 'Following up on {property_address}',
'Hi {seller_name},

I wanted to follow up regarding your property at {property_address}.

We are still very interested and would love to make you a fair cash offer.

Would you be available for a quick call this week?

Best regards,
{your_name}
{company_name}
{your_phone}',
'["seller_name", "property_address", "your_name", "company_name", "your_phone"]'::jsonb),

('Investor Property Alert', 'investor_broadcast', 'New Deal Alert: {property_address}',
'Hi {investor_name},

We just got a new property that matches your investment criteria:

Property: {property_address}
Bedrooms: {bedrooms}
Bathrooms: {bathrooms}
ARV: ${arv}
Asking Price: ${asking_price}
Est. Repairs: ${repair_estimate}

This is a great opportunity. Let me know if you want to see it!

{your_name}
{company_name}',
'["investor_name", "property_address", "bedrooms", "bathrooms", "arv", "asking_price", "repair_estimate", "your_name", "company_name"]'::jsonb),

('Offer Letter', 'offer_letter', 'Purchase Offer for {property_address}',
'Dear {seller_name},

Thank you for the opportunity to make an offer on your property at {property_address}.

After careful analysis, we would like to offer ${offer_amount} for the property.

This is a cash offer with no financing contingencies and we can close in as little as 7 days.

Please let me know if you would like to move forward.

Sincerely,
{your_name}
{company_name}
{your_phone}',
'["seller_name", "property_address", "offer_amount", "your_name", "company_name", "your_phone"]'::jsonb)
ON CONFLICT DO NOTHING;

-- 3. SMS TEMPLATES
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  message TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Starter SMS templates
INSERT INTO sms_templates (name, category, message, variables) VALUES
('Quick Follow-up', 'seller_followup',
'Hi {seller_name}, this is {your_name} from {company_name}. Still interested in your property at {property_address}. Can we talk today?',
'["seller_name", "your_name", "company_name", "property_address"]'::jsonb),

('Appointment Reminder', 'reminder',
'Reminder: Property showing tomorrow at {property_address} at {appointment_time}. See you then! - {your_name}',
'["property_address", "appointment_time", "your_name"]'::jsonb),

('Deal Alert', 'investor_broadcast',
'New deal: {property_address}, {bedrooms}bd/{bathrooms}ba, ${asking_price}. Interested? Reply YES - {your_name}',
'["property_address", "bedrooms", "bathrooms", "asking_price", "your_name"]'::jsonb)
ON CONFLICT DO NOTHING;

-- 4. EMAIL CAMPAIGNS (for tracking mass sends)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  sent_to TEXT[], -- Array of email addresses
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft', -- draft, sending, sent, failed
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. DRIP SEQUENCES (for automated email sequences)
CREATE TABLE IF NOT EXISTS drip_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. DRIP STEPS (individual emails in a sequence)
CREATE TABLE IF NOT EXISTS drip_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES drip_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  delay_days INTEGER NOT NULL, -- Days after previous step
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. DRIP ENROLLMENTS (tracking who's in which sequence)
CREATE TABLE IF NOT EXISTS drip_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES drip_sequences(id) ON DELETE CASCADE,
  entity_type VARCHAR(50), -- 'seller', 'investor'
  entity_id UUID,
  current_step INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sent_at TIMESTAMP WITH TIME ZONE
);

-- 8. WORKFLOW RULES (automation triggers)
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

-- Starter workflow rules
INSERT INTO workflow_rules (name, description, entity_type, trigger_type, trigger_condition, action_type, action_config, is_active) VALUES
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

('Property Under Contract - Find Buyer', 'Create task to find buyer when property goes under contract', 'property', 'status_change',
  '{"field": "status", "to": "under_contract"}'::jsonb,
  'create_task',
  '{"title": "Find end buyer for property", "description": "Broadcast to investor list and find qualified buyer", "priority": "urgent", "due_days": 7}'::jsonb,
  true)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_workflow_rules_entity_type ON workflow_rules(entity_type);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_active ON workflow_rules(is_active);

-- 9. WORKFLOW EXECUTION LOG
CREATE TABLE IF NOT EXISTS workflow_execution_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES workflow_rules(id) ON DELETE CASCADE,
  entity_type VARCHAR(50),
  entity_id UUID,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  action_result JSONB
);

CREATE INDEX IF NOT EXISTS idx_workflow_execution_log_rule_id ON workflow_execution_log(rule_id);

-- 10. CONTRACT TEMPLATES
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) NOT NULL, -- 'purchase_agreement', 'assignment_contract', 'buyer_agreement', etc.
  content TEXT NOT NULL,
  variables JSONB NOT NULL, -- Array of variable names
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Starter contract templates
INSERT INTO contract_templates (name, description, template_type, content, variables, is_active) VALUES
('Purchase Agreement - Standard', 'Standard wholesale purchase agreement for residential properties', 'purchase_agreement',
'PURCHASE AGREEMENT

This Purchase Agreement is entered into on {contract_date} between:

SELLER: {seller_name}
Address: {seller_address}
Phone: {seller_phone}

BUYER: {buyer_name} (or assignee)
Address: {buyer_address}
Phone: {buyer_phone}

PROPERTY: {property_address}

PURCHASE PRICE: ${purchase_price}
EARNEST MONEY: ${earnest_money_deposit}
CLOSING DATE: {closing_date}

INSPECTION PERIOD: {inspection_days} days

Property sold in "AS-IS" condition.

SIGNATURES:

_________________________  Date: __________
{seller_name} (Seller)

_________________________  Date: __________
{buyer_name} (Buyer)

Generated with Wholesale CRM',
'["contract_date", "seller_name", "seller_address", "seller_phone", "buyer_name", "buyer_address", "buyer_phone", "property_address", "purchase_price", "earnest_money_deposit", "closing_date", "inspection_days"]'::jsonb,
true)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON contract_templates(template_type);

-- 11. GENERATED CONTRACTS
CREATE TABLE IF NOT EXISTS generated_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  contract_name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  generated_content TEXT NOT NULL,
  generated_pdf_url TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, signed, completed, cancelled
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_generated_contracts_status ON generated_contracts(status);

-- 12. APPOINTMENTS / CALENDAR
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  appointment_type VARCHAR(50) NOT NULL, -- 'property_showing', 'seller_meeting', 'investor_meeting', 'closing', 'inspection'
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  description TEXT,
  related_to_type VARCHAR(50), -- 'seller', 'investor', 'property', 'deal'
  related_to_id UUID,
  attendees TEXT[],
  reminder_minutes INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample appointments
INSERT INTO appointments (title, appointment_type, start_time, end_time, location, description, status) VALUES
('Property Showing - 123 Main St', 'property_showing',
  NOW() + INTERVAL '2 days' + INTERVAL '10 hours',
  NOW() + INTERVAL '2 days' + INTERVAL '11 hours',
  '123 Main St, Springfield',
  'Show property to potential investor',
  'scheduled'),

('Closing Appointment', 'closing',
  NOW() + INTERVAL '15 days' + INTERVAL '10 hours',
  NOW() + INTERVAL '15 days' + INTERVAL '11 hours 30 minutes',
  'Title Company Office',
  'Final closing - bring ID and verify wire instructions',
  'scheduled')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ============================================================
-- ALTER EXISTING TABLES (Do this AFTER creating new tables)
-- ============================================================

-- Add campaign_id column to sellers table (links to marketing_campaigns)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='sellers' AND column_name='campaign_id') THEN
        ALTER TABLE sellers ADD COLUMN campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- SUMMARY OF TABLES
-- ============================================================
-- Original tables (6): sellers, properties, investors, deals, tasks, activities
-- Document storage (4 buckets): property-images, property-documents, investor-documents, deal-documents
-- New feature tables (12):
--   1. marketing_campaigns
--   2. email_templates
--   3. sms_templates
--   4. email_campaigns
--   5. drip_sequences
--   6. drip_steps
--   7. drip_enrollments
--   8. workflow_rules
--   9. workflow_execution_log
--   10. contract_templates
--   11. generated_contracts
--   12. appointments

-- TOTAL: 20 database tables

-- ============================================================
-- VERIFY INSTALLATION
-- ============================================================
-- Run this query to verify all new tables exist:
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'marketing_campaigns',
    'email_templates',
    'sms_templates',
    'email_campaigns',
    'drip_sequences',
    'drip_steps',
    'drip_enrollments',
    'workflow_rules',
    'workflow_execution_log',
    'contract_templates',
    'generated_contracts',
    'appointments'
  )
ORDER BY table_name;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
