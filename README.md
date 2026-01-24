# ☕ Café POS System

A modern, table-based Point of Sale system for cafés built with Next.js, Supabase, and shadcn/ui.

## Features

- 🔐 **Authentication** - Email/password login with Supabase Auth
- 🛠 **Admin Panel** - Manage products, tables, and payment methods
- 🧾 **POS Terminal** - Take orders with session management
- 👨‍🍳 **Kitchen Display** - Live order feed with real-time updates
- 💳 **Multiple Payments** - Cash, Digital, and UPI QR support
- 📱 **Customer Display** - Real-time order status for customers
- 📊 **Reports** - Order history with filters

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Realtime**: Supabase Realtime
- **QR Codes**: qrcode.react

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Copy your project URL and anon key from Settings > API

### 3. Configure Environment

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Routes

| Route | Description |
|-------|-------------|
| `/login` | Login/Signup page |
| `/admin` | Admin dashboard |
| `/admin/products` | Manage products |
| `/admin/tables` | Manage tables |
| `/admin/payments` | Configure payment methods |
| `/pos` | POS terminal |
| `/kitchen` | Kitchen display (real-time) |
| `/customer?order_id=<ID>` | Customer order status |
| `/reports` | Order reports |

## Database Schema

The system uses 7 tables:
- `products` - Menu items
- `tables` - Café seating
- `pos_sessions` - POS session tracking
- `orders` - Customer orders
- `order_items` - Items in each order
- `payment_methods` - Configured payment options
- `payments` - Payment records

## Usage Flow

1. **Setup** (Admin)
   - Add products in Admin > Products
   - Create tables in Admin > Tables
   - Configure UPI ID in Admin > Payments

2. **Take Orders** (POS)
   - Start a POS session
   - Select a table
   - Add items to the order
   - Send to kitchen

3. **Prepare Orders** (Kitchen)
   - View incoming orders
   - Move through statuses: To Cook → Preparing → Completed

4. **Process Payment** (POS)
   - Select completed order
   - Choose payment method
   - For UPI: Show QR to customer
   - Confirm payment

5. **Customer View**
   - Share order link with customer
   - They see real-time status updates

## Deployment

### Vercel (Frontend)

```bash
npm run build
vercel deploy
```

### Environment Variables for Production

Set these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## License

MIT
