-- Contract Templates Schema for Wholesale CRM
-- Enables generation of professional contracts with variable replacement

-- Create contract_templates table
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) NOT NULL, -- 'purchase_agreement', 'assignment_contract', 'buyer_agreement', 'seller_agreement', 'disclosure', 'addendum'
  content TEXT NOT NULL, -- Contract template with {variable} placeholders
  variables JSONB NOT NULL, -- Array of available variables for this template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_contracts table to track generated documents
CREATE TABLE IF NOT EXISTS generated_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  contract_name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50), -- 'seller', 'property', 'deal', 'investor'
  entity_id UUID,
  generated_content TEXT NOT NULL, -- Filled-in contract
  generated_pdf_url TEXT, -- Supabase Storage URL if PDF generated
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, signed, completed, cancelled
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON contract_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_generated_contracts_template ON generated_contracts(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_contracts_entity ON generated_contracts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_generated_contracts_status ON generated_contracts(status);

-- Insert starter contract templates
INSERT INTO contract_templates (name, description, template_type, content, variables, is_active) VALUES

('Purchase Agreement - Standard', 'Standard wholesale purchase agreement for residential properties', 'purchase_agreement',
'PURCHASE AGREEMENT

This Purchase Agreement ("Agreement") is entered into on {contract_date} between:

SELLER: {seller_name}
Address: {seller_address}
Phone: {seller_phone}
Email: {seller_email}

BUYER: {buyer_name} (or assignee)
Address: {buyer_address}
Phone: {buyer_phone}
Email: {buyer_email}

PROPERTY DESCRIPTION:
{property_address}
Legal Description: {legal_description}

PURCHASE PRICE: ${purchase_price}

EARNEST MONEY DEPOSIT: ${earnest_money_deposit}
To be held in escrow by {title_company}.

CLOSING DATE: {closing_date}

INSPECTION PERIOD: {inspection_days} days from the date of this Agreement. Buyer reserves the right to terminate this Agreement during the inspection period.

PROPERTY CONDITION: Seller agrees to deliver the property in "AS-IS" condition. Buyer acknowledges they have inspected the property and accepts it in its current condition.

TITLE: Seller agrees to deliver marketable title, free and clear of all liens and encumbrances, except those specifically agreed upon.

ASSIGNMENT: Buyer may assign this contract to another party. Assignment fee: ${assignment_fee}

CONTINGENCIES:
1. Property inspection satisfactory to Buyer
2. Title report satisfactory to Buyer
3. Buyer''s ability to secure financing (if applicable)

CLOSING COSTS: To be split equally between Buyer and Seller unless otherwise agreed.

SIGNATURES:

_________________________                    Date: __________
{seller_name} (Seller)

_________________________                    Date: __________
{buyer_name} (Buyer)

This document was generated using Wholesale CRM',
'["contract_date", "seller_name", "seller_address", "seller_phone", "seller_email", "buyer_name", "buyer_address", "buyer_phone", "buyer_email", "property_address", "legal_description", "purchase_price", "earnest_money_deposit", "title_company", "closing_date", "inspection_days", "assignment_fee"]'::jsonb,
true),

('Assignment Contract', 'Contract to assign purchase agreement to end buyer', 'assignment_contract',
'ASSIGNMENT OF PURCHASE AGREEMENT

This Assignment Agreement is made on {assignment_date} between:

ASSIGNOR (Original Buyer): {assignor_name}
Address: {assignor_address}

ASSIGNEE (New Buyer): {assignee_name}
Address: {assignee_address}

PROPERTY: {property_address}

ORIGINAL PURCHASE AGREEMENT: Dated {original_contract_date} between {seller_name} (Seller) and {assignor_name} (Buyer) for the purchase of the above property.

ASSIGNMENT FEE: ${assignment_fee}
Payable by Assignee to Assignor at closing.

PURCHASE PRICE: ${purchase_price}
Total amount Assignee will pay to Seller.

TOTAL DUE AT CLOSING: ${total_due}
(Purchase Price + Assignment Fee)

CLOSING DATE: {closing_date}

TERMS:
1. Assignor assigns all rights, title, and interest in the Original Purchase Agreement to Assignee.
2. Assignee assumes all obligations and responsibilities of Buyer under the Original Purchase Agreement.
3. Assignor will receive the Assignment Fee at closing.
4. Assignee is responsible for all closing costs beyond the Assignment Fee.

SIGNATURES:

_________________________                    Date: __________
{assignor_name} (Assignor)

_________________________                    Date: __________
{assignee_name} (Assignee)

_________________________                    Date: __________
{seller_name} (Seller - Acknowledging Assignment)

Generated with Wholesale CRM',
'["assignment_date", "assignor_name", "assignor_address", "assignee_name", "assignee_address", "property_address", "original_contract_date", "seller_name", "assignment_fee", "purchase_price", "total_due", "closing_date"]'::jsonb,
true),

('Buyer Representation Agreement', 'Agreement representing investor/buyer in property search', 'buyer_agreement',
'BUYER REPRESENTATION AGREEMENT

This Agreement is made on {agreement_date} between:

AGENT/COMPANY: {company_name}
Representative: {agent_name}
Address: {company_address}
Phone: {company_phone}

BUYER: {buyer_name}
Address: {buyer_address}
Phone: {buyer_phone}
Email: {buyer_email}

TERM: This agreement begins on {start_date} and continues for {term_months} months.

BUYER CRITERIA:
- Property Types: {property_types}
- Price Range: ${min_price} - ${max_price}
- Preferred Areas: {preferred_areas}
- Investment Strategy: {investment_strategy}

AGENT RESPONSIBILITIES:
1. Search for properties matching Buyer''s criteria
2. Provide property analysis and comparables
3. Negotiate on behalf of Buyer
4. Coordinate inspections and due diligence
5. Facilitate closing process

BUYER RESPONSIBILITIES:
1. Provide proof of funds or financing pre-approval
2. Respond promptly to property opportunities
3. Be available for property viewings
4. Work exclusively with Agent for properties matching criteria during term

COMPENSATION:
Agent will be compensated ${agent_fee} or {agent_percentage}% of purchase price per closed transaction.

SIGNATURES:

_________________________                    Date: __________
{agent_name} for {company_name}

_________________________                    Date: __________
{buyer_name}

Generated with Wholesale CRM',
'["agreement_date", "company_name", "agent_name", "company_address", "company_phone", "buyer_name", "buyer_address", "buyer_phone", "buyer_email", "start_date", "term_months", "property_types", "min_price", "max_price", "preferred_areas", "investment_strategy", "agent_fee", "agent_percentage"]'::jsonb,
true);

COMMENT ON TABLE contract_templates IS 'Reusable contract templates with variable placeholders';
COMMENT ON TABLE generated_contracts IS 'Tracks all generated contracts from templates';
