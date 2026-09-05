# Café POS System

A full-stack, cloud-native Point of Sale, Kitchen Display, and Self-Ordering platform for cafés built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Key Features

- **Role-Based Access Control (RBAC)** — 5 staff roles (`admin`, `manager`, `cashier`, `kitchen`, `viewer`) enforced via middleware and route guards.
- **POS Terminal (`/pos`)** — Shift session management, multi-floor table matrix, categorized product catalog with variants, and order type support (Dine-In, Takeaway, Pickup, Delivery).
- **Real-Time Kitchen Display (`/kitchen`)** — Live WebSocket order stream with item-level preparation tracking and status transitions (`To Cook` → `Preparing` → `Completed`).
- **QR Self-Ordering (`/order/[token]`)** — Table-linked, expirable QR tokens allowing customers to browse the menu and place orders directly from their phones.
- **Customer & Counter Displays (`/customer`, `/counter`)** — Real-time secondary screens for order status and UPI payment QR codes.
- **Multiple Payment Methods** — Cash, Card/Digital, and dynamic UPI QR code checkout backed by atomic database transactions.
- **Admin Panel & Analytics (`/admin`, `/reports`)** — Interactive Recharts dashboards (hourly sales, top products, table utilization), product/variant/floor/table management, and PDF/Excel report exports.

## Tech Stack

- **Framework:** Next.js 14 (App Router, Server Actions, TypeScript)
- **Styling:** Tailwind CSS, Radix UI / shadcn/ui
- **Backend & Database:** Supabase (PostgreSQL, Row-Level Security, Auth, Realtime)
- **Analytics & Export:** Recharts, jsPDF, SheetJS (`xlsx`)
- **QR Codes:** `qrcode.react`, `react-qr-code`

## Project Structure

```text
├── src/
│   ├── app/
│   │   ├── admin/          # Dashboard, products, floors, tables, orders, payments, tokens
│   │   ├── counter/        # Counter secondary display
│   │   ├── customer/       # Customer order status display
│   │   ├── kitchen/        # Real-time Kitchen Display System (KDS)
│   │   ├── login/          # Authentication & role selection
│   │   ├── order/[token]/  # QR self-ordering storefront
│   │   ├── pos/            # Main cashier POS terminal
│   │   └── reports/        # Filterable sales reports & PDF/Excel export
│   ├── components/         # Auth guards, payment modals, variant manager, UI primitives
│   ├── hooks/              # Supabase Realtime hooks & toast state
│   └── lib/
│       ├── actions/        # Next.js Server Actions
│       ├── supabase/       # Server, client, and middleware Supabase helpers
│       ├── types/          # Database & enum TypeScript definitions
│       └── utils/          # Export & formatting utilities
└── supabase/
    ├── schema.sql          # Base relational schema & RLS policies
    ├── seed.sql            # Sample menu items, floors, and tables
    └── migrations/         # Incremental SQL migrations (RBAC, atomic ops, indexes)
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run:
   - `supabase/schema.sql`
   - Migrations in `supabase/migrations/`
   - *(Optional)* `supabase/seed.sql` for sample products, floors, and tables.
3. Copy your **Project URL** and **anon public key** from **Project Settings → API**.

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Application Routes

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page (redirects authenticated users to `/pos`) |
| `/login` | Public | Sign in & role-based sign up |
| `/pos` | Authenticated | Main POS terminal & table matrix |
| `/kitchen` | Authenticated | Real-time Kitchen Display System |
| `/admin` | Admin / Manager | Analytics dashboard & management sidebar |
| `/admin/products` | Admin / Manager | Menu catalog & product variants |
| `/admin/floors` | Admin / Manager | Floor plan management |
| `/admin/tables` | Admin / Manager | Table configuration & seating |
| `/admin/orders` | Admin / Manager | Order history & status management |
| `/admin/payments` | Admin / Manager | Payment method & UPI configuration |
| `/admin/tokens` | Admin / Manager | Self-ordering QR token management |
| `/reports` | Admin / Manager | Sales reports with PDF & Excel export |
| `/customer` | Public / Screen | Customer-facing order status view |
| `/counter` | Public / Screen | Counter terminal display |
| `/order/[token]` | Public (Token) | Customer QR self-ordering page |
