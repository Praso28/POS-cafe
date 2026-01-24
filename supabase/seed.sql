-- Café POS System - Seed Data
-- Run this AFTER schema.sql in your Supabase SQL Editor

-- =============================================
-- PRODUCTS (15 items across categories)
-- =============================================
INSERT INTO products (name, category, price, active) VALUES
  -- Coffee
  ('Espresso', 'Coffee', 120.00, true),
  ('Americano', 'Coffee', 150.00, true),
  ('Cappuccino', 'Coffee', 180.00, true),
  ('Latte', 'Coffee', 200.00, true),
  ('Mocha', 'Coffee', 220.00, true),
  ('Cold Brew', 'Coffee', 180.00, true),
  -- Tea
  ('Masala Chai', 'Tea', 80.00, true),
  ('Green Tea', 'Tea', 100.00, true),
  ('Iced Tea', 'Tea', 120.00, true),
  -- Pastries
  ('Croissant', 'Pastry', 90.00, true),
  ('Chocolate Muffin', 'Pastry', 110.00, true),
  ('Blueberry Scone', 'Pastry', 100.00, true),
  -- Snacks
  ('Grilled Sandwich', 'Snacks', 180.00, true),
  ('Paneer Wrap', 'Snacks', 200.00, true),
  ('French Fries', 'Snacks', 120.00, true);

-- =============================================
-- TABLES (10 café tables)
-- =============================================
INSERT INTO tables (name, seats, active) VALUES
  ('Table 1', 2, true),
  ('Table 2', 2, true),
  ('Table 3', 4, true),
  ('Table 4', 4, true),
  ('Table 5', 4, true),
  ('Table 6', 6, true),
  ('Table 7', 6, true),
  ('Table 8', 2, true),
  ('Counter 1', 1, true),
  ('Counter 2', 1, true);

-- =============================================
-- Note: The following tables need user_id and references
-- Run these AFTER you have created a user account
-- =============================================

-- To insert sample orders, first get your user_id:
-- SELECT id FROM auth.users LIMIT 1;
-- Then replace 'YOUR_USER_ID' below with the actual UUID

-- Example (uncomment and update after creating a user):
/*
-- Create a POS Session
INSERT INTO pos_sessions (user_id, status) VALUES
  ('YOUR_USER_ID', 'open');

-- Get the session_id and table_id for orders
-- Use these to create sample orders:

INSERT INTO orders (table_id, session_id, status, total)
SELECT 
  t.id as table_id,
  s.id as session_id,
  'paid',
  350.00
FROM tables t, pos_sessions s
WHERE t.name = 'Table 1' AND s.status = 'open'
LIMIT 1;
*/

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Check products: SELECT * FROM products;
-- Check tables: SELECT * FROM tables;
-- Check payment methods: SELECT * FROM payment_methods;
