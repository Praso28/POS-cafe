-- Migration: Fix Foreign Key Cascade Rules
-- Prevents accidental data loss from improper cascade settings

-- Fix tables.floor_id - prevent floor deletion if tables exist
ALTER TABLE tables 
DROP CONSTRAINT IF EXISTS tables_floor_id_fkey;

ALTER TABLE tables
ADD CONSTRAINT tables_floor_id_fkey
FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE RESTRICT;

-- Fix tables.current_order_id - allow NULL when order deleted (correct behavior)
ALTER TABLE tables
DROP CONSTRAINT IF EXISTS tables_current_order_id_fkey;

ALTER TABLE tables
ADD CONSTRAINT tables_current_order_id_fkey
FOREIGN KEY (current_order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- Fix order_items.order_id - cascade delete items when order deleted
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

ALTER TABLE order_items
ADD CONSTRAINT order_items_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Fix order_items.product_id - restrict deletion of products with order history
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;

-- Fix orders.table_id - allow NULL when table deleted (for historical orders)
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_table_id_fkey;

ALTER TABLE orders
ADD CONSTRAINT orders_table_id_fkey
FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL;

-- Fix orders.session_id - restrict deletion of sessions with orders
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_session_id_fkey;

ALTER TABLE orders
ADD CONSTRAINT orders_session_id_fkey
FOREIGN KEY (session_id) REFERENCES pos_sessions(id) ON DELETE RESTRICT;

-- Fix payments.order_id - cascade delete payments when order deleted
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_order_id_fkey;

ALTER TABLE payments
ADD CONSTRAINT payments_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Fix payments.payment_method_id - restrict deletion of payment methods in use
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_payment_method_id_fkey;

ALTER TABLE payments
ADD CONSTRAINT payments_payment_method_id_fkey
FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT;

-- Fix pos_sessions.user_id - allow NULL when user deleted (for audit trail)
ALTER TABLE pos_sessions
DROP CONSTRAINT IF EXISTS pos_sessions_user_id_fkey;

ALTER TABLE pos_sessions
ADD CONSTRAINT pos_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix pos_sessions.closed_by - allow NULL when user deleted
ALTER TABLE pos_sessions
DROP CONSTRAINT IF EXISTS pos_sessions_closed_by_fkey;

ALTER TABLE pos_sessions
ADD CONSTRAINT pos_sessions_closed_by_fkey
FOREIGN KEY (closed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

