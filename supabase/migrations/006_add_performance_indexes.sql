-- Migration: Add Performance Indexes
-- Improves query performance for common operations

-- Additional indexes for order queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_session_status ON orders(session_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_sent_to_kitchen_at ON orders(sent_to_kitchen_at) WHERE sent_to_kitchen_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON orders(completed_at) WHERE completed_at IS NOT NULL;

-- Indexes for order_items queries
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_prepared ON order_items(prepared) WHERE prepared IS NOT NULL;

-- Indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at) WHERE paid_at IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tables_floor_status ON tables(floor_id, status);

-- Index for user roles lookups (if not already created in migration 001)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Index for POS sessions
CREATE INDEX IF NOT EXISTS idx_pos_sessions_user_status ON pos_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_opened_at ON pos_sessions(opened_at DESC);

-- Analyze tables to update statistics
ANALYZE products;
ANALYZE floors;
ANALYZE tables;
ANALYZE pos_sessions;
ANALYZE orders;
ANALYZE order_items;
ANALYZE payments;
ANALYZE payment_methods;
ANALYZE user_roles;

