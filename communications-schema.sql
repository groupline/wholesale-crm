-- Email and SMS Templates for Communication System
-- Run this in Supabase SQL Editor

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- seller_followup, investor_broadcast, offer_letter, general
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  variables JSONB, -- Array of available variables like {seller_name}, {property_address}, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Templates Table
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- seller_followup, investor_broadcast, appointment_reminder, general
  message TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Campaigns/Broadcasts Table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_type VARCHAR(50), -- investors, sellers, custom
  recipient_ids JSONB, -- Array of specific recipient UUIDs
  subject VARCHAR(500),
  body TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sending, sent, failed
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drip Campaign Sequences
CREATE TABLE IF NOT EXISTS drip_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(100), -- manual, status_change, date_based, new_lead
  trigger_condition JSONB, -- Conditions for auto-triggering
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drip Sequence Steps
CREATE TABLE IF NOT EXISTS drip_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES drip_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  delay_days INTEGER DEFAULT 0, -- Days after previous step (or trigger)
  action_type VARCHAR(50), -- email, sms, task
  template_id UUID, -- Reference to email_templates or sms_templates
  task_title VARCHAR(255), -- If action_type is 'task'
  task_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drip Enrollments (who's in what sequence)
CREATE TABLE IF NOT EXISTS drip_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES drip_sequences(id) ON DELETE CASCADE,
  entity_type VARCHAR(50), -- seller, investor, property
  entity_id UUID,
  current_step INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed, cancelled
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_sms_templates_category ON sms_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_drip_steps_sequence ON drip_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_drip_enrollments_sequence ON drip_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_drip_enrollments_entity ON drip_enrollments(entity_type, entity_id);

-- Insert some starter email templates
INSERT INTO email_templates (name, category, subject, body, variables) VALUES
('Seller Follow-up #1', 'seller_followup', 'Following up on {property_address}',
'Hi {seller_name},

I wanted to follow up regarding the property at {property_address}.

We''re very interested in making you a fair cash offer. Are you available for a quick call this week?

Best regards,
{your_name}
{company_name}',
'["seller_name", "property_address", "your_name", "company_name"]'::jsonb),

('Investor Property Alert', 'investor_broadcast', 'New Deal Alert: {property_address}',
'Hi {investor_name},

We just got a great new property that matches your investment criteria:

📍 Address: {property_address}
🛏️ Beds/Baths: {bedrooms}/{bathrooms}
💰 Price: ${asking_price}
📊 ARV: ${arv}
🔧 Estimated Repairs: ${repair_estimate}

This won''t last long. Interested? Reply to this email or call me directly.

{your_name}
{company_name}
{your_phone}',
'["investor_name", "property_address", "bedrooms", "bathrooms", "asking_price", "arv", "repair_estimate", "your_name", "company_name", "your_phone"]'::jsonb),

('Offer Letter', 'offer_letter', 'Cash Offer for {property_address}',
'Dear {seller_name},

Thank you for allowing us to view your property at {property_address}.

We would like to present you with a cash offer of ${offer_amount} for your property. This offer includes:

✓ All cash - no financing contingencies
✓ Close in as little as 7-14 days
✓ We buy as-is - no repairs needed
✓ No realtor fees or commissions

We''re ready to move forward immediately. Please let me know if you have any questions.

Best regards,
{your_name}
{company_name}
{your_phone}',
'["seller_name", "property_address", "offer_amount", "your_name", "company_name", "your_phone"]'::jsonb)

ON CONFLICT DO NOTHING;

-- Insert some starter SMS templates
INSERT INTO sms_templates (name, category, message, variables) VALUES
('Seller Quick Follow-up', 'seller_followup',
'Hi {seller_name}, this is {your_name} from {company_name}. Still interested in selling {property_address}? Let me know!',
'["seller_name", "your_name", "company_name", "property_address"]'::jsonb),

('Appointment Reminder', 'appointment_reminder',
'Reminder: We have an appointment scheduled for {appointment_date} at {appointment_time} for {property_address}. See you then! -{your_name}',
'["appointment_date", "appointment_time", "property_address", "your_name"]'::jsonb),

('Investor New Deal SMS', 'investor_broadcast',
'🏠 New deal alert! {bedrooms}bd/{bathrooms}ba at {property_address} for ${asking_price}. ARV ${arv}. Interested? Call {your_phone}',
'["bedrooms", "bathrooms", "property_address", "asking_price", "arv", "your_phone"]'::jsonb)

ON CONFLICT DO NOTHING;

COMMENT ON TABLE email_templates IS 'Reusable email templates with variable placeholders';
COMMENT ON TABLE sms_templates IS 'Reusable SMS templates with variable placeholders';
COMMENT ON TABLE email_campaigns IS 'Email broadcasts to investors or sellers';
COMMENT ON TABLE drip_sequences IS 'Automated multi-step email/SMS sequences';
COMMENT ON TABLE drip_steps IS 'Individual steps in a drip sequence';
COMMENT ON TABLE drip_enrollments IS 'Tracks which entities are enrolled in which sequences';
