# 🏠 Wholesale Realty CRM

A comprehensive CRM system built specifically for wholesale real estate businesses. Manage sellers, properties, investors, and deals all in one place with document storage and full pipeline tracking.

## ✨ Features

### 📊 Dashboard
- Real-time metrics and analytics
- Revenue tracking
- Pipeline overview with progress visualization
- Quick action buttons

### 👥 Seller Management
- Complete contact information tracking
- Lead source attribution
- Status pipeline: New → Contacted → Qualified → Offer Made → Under Contract → Closed
- Activity timeline

### 🏠 Property Management
- Detailed property information (address, beds, baths, sqft, etc.)
- Financial tracking (estimated value, asking price, our offer, ARV, repair costs)
- Property condition assessment
- Photo uploads
- Document storage (contracts, inspections, etc.)
- Link to sellers

### 💼 Investor/Buyer List Management
- Investment strategy tracking (BRRRR, fix-and-flip, buy-and-hold, wholesale)
- Budget range tracking
- Geographic preferences
- Property type preferences
- Financing needs tracking
- Proof of funds status
- Document storage

### 🤝 Deal Management
- Connect properties to investors
- Track purchase and sale prices
- Calculate assignment fees automatically
- Deal types: wholesale, double-close, assignment
- Contract and closing date management
- Complete document storage

### ✅ Task Management
- Create and assign tasks
- Priority levels (low, medium, high, urgent)
- Link to sellers, investors, properties, or deals
- Due date tracking

### 📁 Document & Image Storage
- Supabase storage integration
- Organized by entity type
- Secure document management

## 🚀 Quick Start

### 1. Database Setup

Run the SQL schema in your Supabase project:

1. Go to: https://owmffmdtppjlixssljcm.supabase.co
2. Navigate to SQL Editor
3. Copy and run the contents of `supabase-schema.sql`

### 2. Storage Buckets

Create these buckets in Supabase Storage:
- `property-images`
- `property-documents`
- `investor-documents`
- `deal-documents`

### 3. Run the Application

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📊 Database Schema

### Core Tables
- `sellers` - Property seller leads
- `properties` - Property inventory
- `investors` - Buyer list
- `deals` - Transaction pipeline
- `tasks` - Task management
- `activities` - Activity log

### Document Tables
- `property_images`
- `property_documents`
- `investor_documents`
- `deal_documents`

## 🎯 Roadmap

- [x] Dashboard with metrics
- [x] Database schema
- [x] Navigation structure
- [ ] Seller CRUD pages
- [ ] Property CRUD pages with image upload
- [ ] Investor CRUD pages
- [ ] Deal pipeline with drag-and-drop
- [ ] Auto-matching system
- [ ] Email integration
- [ ] SMS integration
- [ ] Calendar/scheduling
- [ ] Advanced reporting

## 📂 Project Structure

```
wholesale-crm/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── Sidebar.tsx           # Navigation
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── database.types.ts     # TypeScript types
├── supabase-schema.sql       # Database schema
└── README.md
```

## 📝 Notes

- Environment variables are pre-configured in `.env.local`
- The dashboard fetches real-time data from Supabase
- All tables have automatic `updated_at` triggers
- Indexes are optimized for performance

## 📄 License

MIT
