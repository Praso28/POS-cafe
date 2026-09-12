-- Café POS System - Seed Data
-- Run this AFTER schema.sql in your Supabase SQL Editor

-- =============================================
-- PRODUCTS (15 items across categories)
-- =============================================
INSERT INTO products (name, category, price, unit, tax, description, active) VALUES
  -- Coffee
  ('Espresso', 'Coffee', 120.00, 'cup', 5.00, 'Strong and bold espresso shot', true),
  ('Americano', 'Coffee', 150.00, 'cup', 5.00, 'Espresso with hot water', true),
  ('Cappuccino', 'Coffee', 180.00, 'cup', 5.00, 'Espresso with steamed milk and foam', true),
  ('Latte', 'Coffee', 200.00, 'cup', 5.00, 'Espresso with steamed milk', true),
  ('Mocha', 'Coffee', 220.00, 'cup', 5.00, 'Espresso with chocolate and milk', true),
  ('Cold Brew', 'Coffee', 180.00, 'cup', 5.00, 'Smooth cold-brewed coffee', true),
  -- Tea
  ('Masala Chai', 'Tea', 80.00, 'cup', 5.00, 'Traditional Indian spiced tea', true),
  ('Green Tea', 'Tea', 100.00, 'cup', 5.00, 'Fresh green tea leaves', true),
  ('Iced Tea', 'Tea', 120.00, 'cup', 5.00, 'Refreshing iced tea', true),
  -- Pastries
  ('Croissant', 'Pastry', 90.00, 'piece', 12.00, 'Buttery French pastry', true),
  ('Chocolate Muffin', 'Pastry', 110.00, 'piece', 12.00, 'Rich chocolate muffin', true),
  ('Blueberry Scone', 'Pastry', 100.00, 'piece', 12.00, 'Fresh blueberry scone', true),
  -- Snacks
  ('Grilled Sandwich', 'Snacks', 180.00, 'piece', 12.00, 'Grilled vegetable sandwich', true),
  ('Paneer Wrap', 'Snacks', 200.00, 'piece', 12.00, 'Paneer tikka wrap', true),
  ('French Fries', 'Snacks', 120.00, 'plate', 12.00, 'Crispy golden fries', true);

-- =============================================
-- FLOORS (3 café floors)
-- =============================================
INSERT INTO floors (name, active) VALUES
  ('Ground Floor', true),
  ('First Floor', true),
  ('Outdoor Seating', true);

-- =============================================
-- TABLES (10 café tables with floor assignments)
-- =============================================
INSERT INTO tables (name, seats, floor_id, active)
SELECT 
  t.name,
  t.seats,
  f.id as floor_id,
  true as active
FROM (
  VALUES
    ('Table 1', 2, 'Ground Floor'),
    ('Table 2', 2, 'Ground Floor'),
    ('Table 3', 4, 'Ground Floor'),
    ('Table 4', 4, 'First Floor'),
    ('Table 5', 4, 'First Floor'),
    ('Table 6', 6, 'First Floor'),
    ('Table 7', 6, 'Outdoor Seating'),
    ('Table 8', 2, 'Outdoor Seating'),
    ('Counter 1', 1, 'Ground Floor'),
    ('Counter 2', 1, 'Ground Floor')
) AS t(name, seats, floor_name)
CROSS JOIN floors f
WHERE f.name = t.floor_name;

-- =============================================
-- SAMPLE ORDERS AND POS SESSIONS (with actual user ID)
-- =============================================

-- Create a POS Session
INSERT INTO pos_sessions (user_id, status) VALUES
  ('76020d59-85b1-4131-a05e-8fc4defbcd6a', 'open');

-- Create sample orders
INSERT INTO orders (table_id, session_id, status, total, created_at)
SELECT 
  t.id as table_id,
  s.id as session_id,
  'paid',
  350.00,
  now()
FROM tables t, pos_sessions s
WHERE t.name = 'Table 1' AND s.status = 'open'
LIMIT 1;

INSERT INTO orders (table_id, session_id, status, total, created_at)
SELECT 
  t.id as table_id,
  s.id as session_id,
  'completed',
  250.00,
  now()
FROM tables t, pos_sessions s
WHERE t.name = 'Table 2' AND s.status = 'open'
LIMIT 1;

INSERT INTO orders (table_id, session_id, status, total, created_at)
SELECT 
  t.id as table_id,
  s.id as session_id,
  'open',
  450.00,
  now()
FROM tables t, pos_sessions s
WHERE t.name = 'Table 3' AND s.status = 'open'
LIMIT 1;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Check products: SELECT * FROM products;
-- Check tables: SELECT * FROM tables;
-- Check payment methods: SELECT * FROM payment_methods;
