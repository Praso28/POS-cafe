-- Migration: Add Role-Based Access Control (RBAC)
-- This migration adds user roles and updates RLS policies for enterprise-level security

-- Step 1: Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'kitchen')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins manage roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Step 2: Drop overly permissive policies on products
DROP POLICY IF EXISTS "Allow authenticated read products" ON products;
DROP POLICY IF EXISTS "Allow authenticated insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated delete products" ON products;

-- Step 3: Create role-based policies for products
CREATE POLICY "Anyone authenticated can read products" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins/managers can write products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Step 4: Update floors policies
DROP POLICY IF EXISTS "Allow authenticated read floors" ON floors;
DROP POLICY IF EXISTS "Allow authenticated insert floors" ON floors;
DROP POLICY IF EXISTS "Allow authenticated update floors" ON floors;
DROP POLICY IF EXISTS "Allow authenticated delete floors" ON floors;

CREATE POLICY "Anyone authenticated can read floors" ON floors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins/managers can write floors" ON floors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Step 5: Update tables policies
DROP POLICY IF EXISTS "Allow authenticated read tables" ON tables;
DROP POLICY IF EXISTS "Allow authenticated insert tables" ON tables;
DROP POLICY IF EXISTS "Allow authenticated update tables" ON tables;
DROP POLICY IF EXISTS "Allow authenticated delete tables" ON tables;

CREATE POLICY "Anyone authenticated can read tables" ON tables
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins/managers can write tables" ON tables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Step 6: Update payment_methods policies
DROP POLICY IF EXISTS "Allow authenticated read payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Allow authenticated update payment_methods" ON payment_methods;
DROP POLICY IF EXISTS "Allow authenticated insert payment_methods" ON payment_methods;

CREATE POLICY "Anyone authenticated can read payment_methods" ON payment_methods
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins/managers can write payment_methods" ON payment_methods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Step 7: Remove dangerous anonymous access to sensitive data
DROP POLICY IF EXISTS "Allow anon read orders" ON orders;
DROP POLICY IF EXISTS "Allow anon read order_items" ON order_items;
DROP POLICY IF EXISTS "Allow anon read payments" ON payments;

-- Step 8: Keep authenticated access to orders (staff need this)
-- Policies already exist, no changes needed for orders/order_items/payments for authenticated users

-- Step 9: Add index for role lookups (performance optimization)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Step 10: Add updated_at trigger for user_roles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: After running this migration, you MUST manually assign at least one admin user:
-- INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_UUID', 'admin');

