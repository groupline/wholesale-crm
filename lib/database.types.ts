// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      sellers: {
        Row: Seller;
        Insert: Omit<Seller, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Seller, 'id' | 'created_at'>>;
      };
      properties: {
        Row: Property;
        Insert: Omit<Property, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Property, 'id' | 'created_at'>>;
      };
      investors: {
        Row: Investor;
        Insert: Omit<Investor, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Investor, 'id' | 'created_at'>>;
      };
      deals: {
        Row: Deal;
        Insert: Omit<Deal, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Deal, 'id' | 'created_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at'>>;
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'created_at'>;
        Update: Partial<Omit<Activity, 'id' | 'created_at'>>;
      };
    };
  };
};

export interface Seller {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  secondary_phone?: string;
  lead_source?: string;
  notes?: string;
  status: 'new' | 'contacted' | 'qualified' | 'offer_made' | 'under_contract' | 'closed' | 'dead';
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  seller_id?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  lot_size?: string;
  year_built?: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  estimated_value?: number;
  asking_price?: number;
  our_offer?: number;
  arv?: number;
  repair_costs?: number;
  description?: string;
  notes?: string;
  status: 'lead' | 'evaluating' | 'offer_made' | 'under_contract' | 'purchased' | 'wholesaled' | 'closed' | 'dead';
  created_at: string;
  updated_at: string;
}

export interface Investor {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  secondary_phone?: string;
  company_name?: string;
  investor_type?: string[];
  min_budget?: number;
  max_budget?: number;
  preferred_locations?: string[];
  preferred_property_types?: string[];
  needs_financing: boolean;
  proof_of_funds: boolean;
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  notes?: string;
  status: 'active' | 'inactive' | 'do_not_contact';
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  property_id?: string;
  investor_id?: string;
  deal_type?: 'wholesale' | 'double-close' | 'assignment';
  purchase_price?: number;
  sale_price?: number;
  assignment_fee?: number;
  contract_date?: string;
  closing_date?: string;
  actual_close_date?: string;
  status: 'pending' | 'under_contract' | 'closed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  related_to_type?: 'seller' | 'investor' | 'property' | 'deal';
  related_to_id?: string;
  assigned_to?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  activity_type: string;
  description: string;
  related_to_type?: 'seller' | 'investor' | 'property' | 'deal';
  related_to_id?: string;
  created_by?: string;
  created_at: string;
}
