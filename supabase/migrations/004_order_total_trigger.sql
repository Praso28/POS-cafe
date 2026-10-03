-- Migration: Auto-calculate Order Totals
-- Automatically recalculates order total when items are added/updated/deleted

-- Rename qty column to quantity for consistency (if needed)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'qty'
  ) THEN
    ALTER TABLE order_items RENAME COLUMN qty TO quantity;
  END IF;
END $$;

-- Rename price column to unit_price for clarity
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'price'
  ) THEN
    ALTER TABLE order_items RENAME COLUMN price TO unit_price;
  END IF;
END $$;

-- Create function to recalculate order total
CREATE OR REPLACE FUNCTION recalculate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- Get the order_id from the affected row
  v_order_id := COALESCE(NEW.order_id, OLD.order_id);

  -- Recalculate and update order total
  UPDATE orders
  SET 
    total = (
      SELECT COALESCE(SUM(quantity * unit_price), 0)
      FROM order_items
      WHERE order_id = v_order_id
    ),
    updated_at = NOW()
  WHERE id = v_order_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT
DROP TRIGGER IF EXISTS update_order_total_on_insert ON order_items;
CREATE TRIGGER update_order_total_on_insert
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_order_total();

-- Trigger on UPDATE
DROP TRIGGER IF EXISTS update_order_total_on_update ON order_items;
CREATE TRIGGER update_order_total_on_update
AFTER UPDATE ON order_items
FOR EACH ROW
WHEN (OLD.quantity != NEW.quantity OR OLD.unit_price != NEW.unit_price)
EXECUTE FUNCTION recalculate_order_total();

-- Trigger on DELETE
DROP TRIGGER IF EXISTS update_order_total_on_delete ON order_items;
CREATE TRIGGER update_order_total_on_delete
AFTER DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_order_total();

-- Add updated_at trigger for orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

