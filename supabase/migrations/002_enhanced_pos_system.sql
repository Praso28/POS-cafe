-- Enhanced POS System Migration
-- Adds table status tracking, multi-POS terminals, order types, and user roles

-- 1. Add table status tracking for occupancy management
ALTER TABLE tables ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' 
    CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning'));
ALTER TABLE tables ADD COLUMN IF NOT EXISTS current_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS occupied_at TIMESTAMPTZ;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS reservation_name TEXT;

-- 2. Add POS terminal/station support for multi-POS
CREATE TABLE IF NOT EXISTS pos_terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    terminal_type TEXT DEFAULT 'counter' CHECK (terminal_type IN ('counter', 'self-service', 'drive-thru', 'mobile', 'kiosk')),
    active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add terminal reference to pos_sessions
ALTER TABLE pos_sessions ADD COLUMN IF NOT EXISTS terminal_id UUID REFERENCES pos_terminals(id);
ALTER TABLE pos_sessions ADD COLUMN IF NOT EXISTS session_name TEXT;

-- 3. Add order types for dine-in/takeaway/delivery
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'dine-in' 
    CHECK (order_type IN ('dine-in', 'takeaway', 'delivery', 'pickup', 'drive-thru'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number SERIAL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMPTZ;

-- 4. Add user roles for access control
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'kitchen', 'viewer')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role)
);

-- 5. Add customer display sessions for counter mode
CREATE TABLE IF NOT EXISTS customer_display_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id UUID REFERENCES pos_terminals(id),
    current_order_id UUID REFERENCES orders(id),
    display_mode TEXT DEFAULT 'order' CHECK (display_mode IN ('order', 'welcome', 'thankyou', 'idle')),
    last_activity_at TIMESTAMPTZ DEFAULT now(),
    auto_reset_seconds INTEGER DEFAULT 30,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Insert default POS terminal
INSERT INTO pos_terminals (name, description, terminal_type) VALUES
    ('Counter 1', 'Main counter POS terminal', 'counter')
ON CONFLICT DO NOTHING;

-- 7. Enable RLS on new tables
ALTER TABLE pos_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_display_sessions ENABLE ROW LEVEL SECURITY;

-- 8. Create policies for pos_terminals
DROP POLICY IF EXISTS "Allow authenticated read pos_terminals" ON pos_terminals;
CREATE POLICY "Allow authenticated read pos_terminals" ON pos_terminals 
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert pos_terminals" ON pos_terminals;
CREATE POLICY "Allow authenticated insert pos_terminals" ON pos_terminals 
    FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update pos_terminals" ON pos_terminals;
CREATE POLICY "Allow authenticated update pos_terminals" ON pos_terminals 
    FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated delete pos_terminals" ON pos_terminals;
CREATE POLICY "Allow authenticated delete pos_terminals" ON pos_terminals 
    FOR DELETE TO authenticated USING (true);

-- 9. Create policies for user_roles
DROP POLICY IF EXISTS "Allow authenticated read user_roles" ON user_roles;
CREATE POLICY "Allow authenticated read user_roles" ON user_roles 
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow admin manage user_roles" ON user_roles;
CREATE POLICY "Allow admin manage user_roles" ON user_roles 
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- 10. Create policies for customer_display_sessions
DROP POLICY IF EXISTS "Allow authenticated read customer_display_sessions" ON customer_display_sessions;
CREATE POLICY "Allow authenticated read customer_display_sessions" ON customer_display_sessions 
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated manage customer_display_sessions" ON customer_display_sessions;
CREATE POLICY "Allow authenticated manage customer_display_sessions" ON customer_display_sessions 
    FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon read customer_display_sessions" ON customer_display_sessions;
CREATE POLICY "Allow anon read customer_display_sessions" ON customer_display_sessions 
    FOR SELECT TO anon USING (true);

-- 11. Add realtime for new tables (skip if already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'pos_terminals'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE pos_terminals;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'customer_display_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE customer_display_sessions;
    END IF;
END $$;

-- 12. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_current_order ON tables(current_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_terminal_id ON pos_sessions(terminal_id);

-- 13. Create function to auto-update table status on order changes
CREATE OR REPLACE FUNCTION update_table_status_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- When order is created, mark table as occupied
    IF TG_OP = 'INSERT' THEN
        UPDATE tables 
        SET status = 'occupied', 
            current_order_id = NEW.id,
            occupied_at = now()
        WHERE id = NEW.table_id AND status = 'available';
    END IF;
    
    -- When order is completed/paid, release the table
    IF TG_OP = 'UPDATE' AND NEW.status IN ('paid', 'completed') AND OLD.status NOT IN ('paid', 'completed') THEN
        UPDATE tables 
        SET status = 'available', 
            current_order_id = NULL,
            occupied_at = NULL
        WHERE id = NEW.table_id AND current_order_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for table status updates
DROP TRIGGER IF EXISTS trigger_update_table_status ON orders;
CREATE TRIGGER trigger_update_table_status
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_table_status_on_order();

-- 14. Create function to clean up empty orders
CREATE OR REPLACE FUNCTION cleanup_empty_orders()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH empty_orders AS (
        SELECT o.id 
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE oi.id IS NULL 
        AND o.status = 'open'
        AND o.created_at < now() - interval '1 hour'
    )
    DELETE FROM orders WHERE id IN (SELECT id FROM empty_orders);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
