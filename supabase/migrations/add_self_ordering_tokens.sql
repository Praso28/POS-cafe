-- Add self-ordering token system
-- Allows customers to order via mobile/self-service using a unique token linked to a table/session

CREATE TABLE IF NOT EXISTS order_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  session_id UUID REFERENCES pos_sessions(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE order_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for order_tokens
-- Allow anyone (including anonymous) to read active tokens for ordering
CREATE POLICY "Allow anon read active tokens" ON order_tokens FOR SELECT TO anon USING (active = true);
CREATE POLICY "Allow authenticated read tokens" ON order_tokens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert tokens" ON order_tokens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update tokens" ON order_tokens FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete tokens" ON order_tokens FOR DELETE TO authenticated USING (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_order_tokens_token ON order_tokens(token);
CREATE INDEX IF NOT EXISTS idx_order_tokens_table_id ON order_tokens(table_id);
CREATE INDEX IF NOT EXISTS idx_order_tokens_session_id ON order_tokens(session_id);

-- Add token_id to orders to track self-ordering
ALTER TABLE orders ADD COLUMN IF NOT EXISTS token_id UUID REFERENCES order_tokens(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_token_id ON orders(token_id);

COMMENT ON TABLE order_tokens IS 'Tokens for mobile/self-ordering linked to tables and sessions';
COMMENT ON COLUMN orders.token_id IS 'Reference to order token if order was placed via self-ordering';

