-- Calendar/Scheduling Schema for Wholesale CRM
-- Enables scheduling of property showings, meetings, and appointments

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  appointment_type VARCHAR(50) NOT NULL, -- 'property_showing', 'seller_meeting', 'investor_meeting', 'closing', 'inspection', 'phone_call', 'other'
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  description TEXT,
  related_to_type VARCHAR(50), -- 'seller', 'investor', 'property', 'deal'
  related_to_id UUID,
  attendees TEXT[], -- Array of email addresses or names
  reminder_minutes INTEGER DEFAULT 30, -- Minutes before to send reminder
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_end_time ON appointments(end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_related ON appointments(related_to_type, related_to_id);

-- Insert sample appointments for demonstration
INSERT INTO appointments (title, appointment_type, start_time, end_time, location, description, status) VALUES

('Property Showing - 123 Main St', 'property_showing',
  NOW() + INTERVAL '2 days' + INTERVAL '10 hours',
  NOW() + INTERVAL '2 days' + INTERVAL '11 hours',
  '123 Main St, Springfield',
  'Show property to potential investor. Property is distressed SFR with 3bd/2ba.',
  'scheduled'),

('Seller Meeting - Contract Signing', 'seller_meeting',
  NOW() + INTERVAL '3 days' + INTERVAL '14 hours',
  NOW() + INTERVAL '3 days' + INTERVAL '15 hours',
  'Coffee Shop Downtown',
  'Sign purchase agreement with motivated seller. Bring contracts and earnest money check.',
  'scheduled'),

('Closing Appointment', 'closing',
  NOW() + INTERVAL '15 days' + INTERVAL '10 hours',
  NOW() + INTERVAL '15 days' + INTERVAL '11 hours  30 minutes',
  'Title Company Office',
  'Final closing for 456 Oak Ave deal. Bring ID and verify wire instructions.',
  'scheduled'),

('Property Inspection', 'inspection',
  NOW() + INTERVAL '5 days' + INTERVAL '9 hours',
  NOW() + INTERVAL '5 days' + INTERVAL '10 hours 30 minutes',
  '789 Elm Street',
  'General home inspection with contractor. Get repair estimate.',
  'scheduled');

COMMENT ON TABLE appointments IS 'Calendar appointments for property showings, meetings, and other scheduled events';
COMMENT ON COLUMN appointments.reminder_minutes IS 'Number of minutes before appointment to send reminder notification';
COMMENT ON COLUMN appointments.all_day IS 'True if appointment spans entire day without specific time';
