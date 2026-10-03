-- Migration: Atomic Order Creation
-- Fixes race condition where multiple POS terminals can create orders for the same table

-- Add missing columns to tables if they don't exist
ALTER TABLE tables ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved'));
ALTER TABLE tables ADD COLUMN IF NOT EXISTS current_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Add missing columns to orders if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'dine-in' CHECK (order_type IN ('dine-in', 'takeaway', 'self-order'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sent_to_kitchen_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to payments if they don't exist
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id);

-- Add missing columns to pos_sessions if they don't exist
ALTER TABLE pos_sessions ADD COLUMN IF NOT EXISTS total_sales NUMERIC(10,2) DEFAULT 0;
ALTER TABLE pos_sessions ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES auth.users(id);

-- Create atomic order creation function
CREATE OR REPLACE FUNCTION create_order_atomic(
  p_session_id UUID,
  p_table_id UUID,
  p_order_type TEXT DEFAULT 'dine-in'
) RETURNS JSON AS $$
DECLARE
  v_order_id UUID;
  v_table_status TEXT;
BEGIN
  -- Lock the table row to prevent race conditions
  SELECT status INTO v_table_status
  FROM tables
  WHERE id = p_table_id
  FOR UPDATE;

  -- Check if table exists
  IF v_table_status IS NULL THEN
    RETURN json_build_object('error', 'Table not found');
  END IF;

  -- Check if table is available
  IF v_table_status != 'available' THEN
    RETURN json_build_object('error', 'Table is already occupied');
  END IF;

  -- Validate session exists and is open
  IF NOT EXISTS (
    SELECT 1 FROM pos_sessions 
    WHERE id = p_session_id AND status = 'open'
  ) THEN
    RETURN json_build_object('error', 'Invalid or closed session');
  END IF;

  -- Create order
  INSERT INTO orders (session_id, table_id, order_type, status, total)
  VALUES (p_session_id, p_table_id, p_order_type, 'open', 0)
  RETURNING id INTO v_order_id;

  -- Update table status
  UPDATE tables
  SET status = 'occupied', current_order_id = v_order_id
  WHERE id = p_table_id;

  RETURN json_build_object('id', v_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_order_atomic TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_tables_current_order_id ON tables(current_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_pos_sessions_status ON pos_sessions(status);

