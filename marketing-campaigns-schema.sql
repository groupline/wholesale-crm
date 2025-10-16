-- Marketing Campaigns Table for ROI Tracking
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(100) NOT NULL, -- direct_mail, ppc, cold_calling, bandit_signs, seo, referral, etc.
  budget DECIMAL(12,2) DEFAULT 0,
  actual_spent DECIMAL(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add campaign_id to sellers table to track lead source
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_channel ON marketing_campaigns(channel);
CREATE INDEX IF NOT EXISTS idx_sellers_campaign_id ON sellers(campaign_id);

-- Add some sample marketing channels as reference
COMMENT ON COLUMN marketing_campaigns.channel IS 'Marketing channel types: direct_mail, ppc, cold_calling, bandit_signs, seo, social_media, referral, networking, wholesaler_list, for_sale_by_owner, expired_listings, pre_foreclosure, probate, driving_for_dollars, other';
