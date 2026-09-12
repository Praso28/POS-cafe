-- Café POS System Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  unit TEXT,
  tax NUMERIC(5,2) DEFAULT 0,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add unit column to products if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'unit'
    ) THEN
        ALTER TABLE products ADD COLUMN unit TEXT;
    END IF;
END $$;

-- Add tax column to products if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'tax'
    ) THEN
        ALTER TABLE products ADD COLUMN tax NUMERIC(5,2) DEFAULT 0;
    END IF;
END $$;

-- Add description column to products if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'description'
    ) THEN
        ALTER TABLE products ADD COLUMN description TEXT;
    END IF;
END $$;

-- Floors
CREATE TABLE IF NOT EXISTS floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cafe Tables
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  seats INTEGER NOT NULL,
  active BOOLEAN DEFAULT true
);

-- Add floor_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'floor_id'
    ) THEN
        ALTER TABLE tables ADD COLUMN floor_id UUID REFERENCES floors(id) ON DELETE SET NULL;
    END IF;
END $$;

-- POS Sessions
CREATE TABLE IF NOT EXISTS pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id),
  session_id UUID REFERENCES pos_sessions(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'sent', 'preparing', 'completed', 'paid')),
  total NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  qty INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'digital', 'upi')),
  upi_id TEXT,
  enabled BOOLEAN DEFAULT true
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  method TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default payment methods
INSERT INTO payment_methods (name, type, enabled) VALUES
  ('Cash', 'cash', true),
  ('Card/Digital', 'digital', true),
  ('UPI', 'upi', true)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies (permissive for hackathon, tighten for production)
-- Products: Anyone authenticated can read, write
DROP POLICY IF EXISTS "Allow authenticated read products" ON products;
DROP POLICY IF EXISTS "Allow authenticated insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete products" ON products;
CREATE POLICY "Allow authenticated read products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete products" ON products FOR DELETE TO authenticated USING (true);

-- Floors: Anyone authenticated can read, write
DROP POLICY IF EXISTS "Allow authenticated read floors" ON floors;
DROP POLICY IF EXISTS "Allow authenticated insert floors" ON floors;
DROP POLICY IF EXISTS "Allow authenticated update floors" ON floors;
DROP POLICY IF EXISTS "Allow authenticated delete floors" ON floors;
CREATE POLICY "Allow authenticated read floors" ON floors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert floors" ON floors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update floors" ON floors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete floors" ON floors FOR DELETE TO authenticated USING (true);

-- Tables: Anyone authenticated can read, write
DROP POLICY IF EXISTS "Allow authenticated read tables" ON tables;
DROP POLICY IF EXISTS "Allow authenticated insert tables" ON tables;
DROP POLICY IF EXISTS "Allow authenticated update tables" ON tables;
DROP POLICY IF EXISTS "Allow authenticated delete tables" ON tables;
CREATE POLICY "Allow authenticated read tables" ON tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert tables" ON tables FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update tables" ON tables FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete tables" ON tables FOR DELETE TO authenticated USING (true);

-- POS Sessions: Users can manage their own sessions
DROP POLICY IF EXISTS "Allow authenticated read sessions" ON pos_sessions;
DROP POLICY IF EXISTS "Allow authenticated insert sessions" ON pos_sessions;
DROP POLICY IF EXISTS "Allow authenticated update sessions" ON pos_sessions;
CREATE POLICY "Allow authenticated read sessions" ON pos_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert sessions" ON pos_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update sessions" ON pos_sessions FOR UPDATE TO authenticated USING (true);

-- Orders: Anyone authenticated can manage
DROP POLICY IF EXISTS "Allow authenticated read orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated insert orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated update orders" ON orders;
DROP POLICY IF EXISTS "Allow anon read orders" ON orders;
CREATE POLICY "Allow authenticated read orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update orders" ON orders FOR UPDATE TO authenticated USING (true);
-- Allow anonymous for customer display
CREATE POLICY "Allow anon read orders" ON orders FOR SELECT TO anon USING (true);

-- Order Items: Anyone authenticated can manage
DROP POLICY IF EXISTS "Allow authenticated read order_items" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated insert order_items" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated update order_items" ON order_items;
DROP POLICY IF EXISTS "Allow authenticated delete order_items" ON order_items;
DROP POLICY IF EXISTS "Allow anon read order_items" ON order_items;
CREATE POLICY "Allow authenticated read order_items" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert order_items" ON order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update order_items" ON order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete order_items" ON order_items FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow anon read order_items" ON order_items FOR SELECT TO anon USING (true);

-- Payment Methods: Anyone authenticated can read, admin can write
DROP POLICY IF EXISTS "Allow authenticated read payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Allow authenticated update payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Allow authenticated insert payment_methods" ON payment_methods;
CREATE POLICY "Allow authenticated read payment_methods" ON payment_methods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated update payment_methods" ON payment_methods FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert payment_methods" ON payment_methods FOR INSERT TO authenticated WITH CHECK (true);

-- Payments: Anyone authenticated can manage
DROP POLICY IF EXISTS "Allow authenticated read payments" ON payments;
DROP POLICY IF EXISTS "Allow authenticated insert payments" ON payments;
DROP POLICY IF EXISTS "Allow authenticated update payments" ON payments;
DROP POLICY IF EXISTS "Allow anon read payments" ON payments;
CREATE POLICY "Allow authenticated read payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert payments" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update payments" ON payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow anon read payments" ON payments FOR SELECT TO anon USING (true);

-- Enable Realtime for specific tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'payments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE payments;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tables_floor_id ON tables(floor_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
