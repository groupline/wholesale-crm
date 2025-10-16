-- Wholesale Realty CRM Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SELLERS & PROPERTIES
-- =====================================================

-- Sellers table
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  secondary_phone VARCHAR(20),
  lead_source VARCHAR(100), -- Where they came from (website, referral, cold call, etc.)
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, offer_made, under_contract, closed, dead
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  property_type VARCHAR(50), -- single-family, multi-family, condo, land, etc.
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  square_feet INTEGER,
  lot_size VARCHAR(50),
  year_built INTEGER,
  condition VARCHAR(50), -- excellent, good, fair, poor
  estimated_value DECIMAL(12,2),
  asking_price DECIMAL(12,2),
  our_offer DECIMAL(12,2),
  arv DECIMAL(12,2), -- After Repair Value
  repair_costs DECIMAL(12,2),
  description TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'lead', -- lead, evaluating, offer_made, under_contract, purchased, wholesaled, closed, dead
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property images
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property documents
CREATE TABLE property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  document_type VARCHAR(100), -- contract, inspection, title, etc.
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVESTORS / BUYERS
-- =====================================================

-- Investors table
CREATE TABLE investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  secondary_phone VARCHAR(20),
  company_name VARCHAR(255),
  investor_type VARCHAR(100)[], -- ARRAY: ['BRRRR', 'fix-and-flip', 'buy-and-hold', 'wholesale']
  min_budget DECIMAL(12,2),
  max_budget DECIMAL(12,2),
  preferred_locations TEXT[], -- ARRAY of cities/zips
  preferred_property_types VARCHAR(50)[], -- ARRAY: ['single-family', 'multi-family', etc.]
  needs_financing BOOLEAN DEFAULT false,
  proof_of_funds BOOLEAN DEFAULT false,
  experience_level VARCHAR(50), -- beginner, intermediate, advanced
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, do_not_contact
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investor documents
CREATE TABLE investor_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
  document_type VARCHAR(100), -- proof_of_funds, contract, w9, etc.
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DEALS
-- =====================================================

-- Deals table (connects properties to investors)
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  investor_id UUID REFERENCES investors(id) ON DELETE SET NULL,
  deal_type VARCHAR(50), -- wholesale, double-close, assignment
  purchase_price DECIMAL(12,2), -- what we're buying for
  sale_price DECIMAL(12,2), -- what we're selling to investor for
  assignment_fee DECIMAL(12,2),
  contract_date DATE,
  closing_date DATE,
  actual_close_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, under_contract, closed, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal documents
CREATE TABLE deal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  document_type VARCHAR(100), -- purchase_contract, assignment, closing_docs, etc.
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TASKS & ACTIVITIES
-- =====================================================

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  related_to_type VARCHAR(50), -- seller, investor, property, deal
  related_to_id UUID, -- ID of related entity
  assigned_to VARCHAR(100), -- user/team member
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log (timeline of all activities)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type VARCHAR(100) NOT NULL, -- call, email, meeting, note, status_change, etc.
  description TEXT NOT NULL,
  related_to_type VARCHAR(50), -- seller, investor, property, deal
  related_to_id UUID, -- ID of related entity
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX idx_sellers_status ON sellers(status);
CREATE INDEX idx_sellers_created_at ON sellers(created_at DESC);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_seller_id ON properties(seller_id);
CREATE INDEX idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX idx_investors_status ON investors(status);
CREATE INDEX idx_investors_created_at ON investors(created_at DESC);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_property_id ON deals(property_id);
CREATE INDEX idx_deals_investor_id ON deals(investor_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_activities_related ON activities(related_to_type, related_to_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investors_updated_at BEFORE UPDATE ON investors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (Optional - enable if needed)
-- =====================================================

-- ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STORAGE BUCKETS (run these in Supabase Dashboard)
-- =====================================================

-- In Supabase Dashboard > Storage, create these buckets:
-- 1. property-images (Public or Private based on preference)
-- 2. property-documents (Private recommended)
-- 3. investor-documents (Private recommended)
-- 4. deal-documents (Private recommended)
