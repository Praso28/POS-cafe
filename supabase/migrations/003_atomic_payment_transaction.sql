-- Migration: Atomic Payment Transaction
-- Ensures payment and order status are updated together atomically

-- Create atomic payment confirmation function
CREATE OR REPLACE FUNCTION confirm_payment_atomic(
  p_payment_id UUID,
  p_order_id UUID
) RETURNS JSON AS $$
DECLARE
  v_payment_amount NUMERIC;
  v_order_total NUMERIC;
  v_payment_status TEXT;
  v_order_status TEXT;
BEGIN
  -- Lock both rows to prevent concurrent modifications
  SELECT amount, status INTO v_payment_amount, v_payment_status
  FROM payments
  WHERE id = p_payment_id
  FOR UPDATE;

  SELECT total, status INTO v_order_total, v_order_status
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  -- Validate payment exists
  IF v_payment_amount IS NULL THEN
    RETURN json_build_object('error', 'Payment not found');
  END IF;

  -- Validate order exists
  IF v_order_total IS NULL THEN
    RETURN json_build_object('error', 'Order not found');
  END IF;

  -- Validate payment not already completed
  IF v_payment_status = 'completed' THEN
    RETURN json_build_object('error', 'Payment already completed');
  END IF;

  -- Validate order not already paid
  IF v_order_status IN ('paid', 'completed') THEN
    RETURN json_build_object('error', 'Order already paid');
  END IF;

  -- Validate amount matches
  IF v_payment_amount != v_order_total THEN
    RETURN json_build_object(
      'error', 
      format('Payment amount (%s) does not match order total (%s)', v_payment_amount, v_order_total)
    );
  END IF;

  -- Update payment
  UPDATE payments
  SET status = 'completed', paid_at = NOW()
  WHERE id = p_payment_id;

  -- Update order
  UPDATE orders
  SET status = 'paid', updated_at = NOW()
  WHERE id = p_order_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION confirm_payment_atomic TO authenticated;

-- Create function to complete order and release table
CREATE OR REPLACE FUNCTION complete_order_atomic(
  p_order_id UUID
) RETURNS JSON AS $$
DECLARE
  v_table_id UUID;
  v_order_status TEXT;
BEGIN
  -- Lock order row
  SELECT table_id, status INTO v_table_id, v_order_status
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  -- Validate order exists
  IF v_order_status IS NULL THEN
    RETURN json_build_object('error', 'Order not found');
  END IF;

  -- Validate order not already completed
  IF v_order_status = 'completed' THEN
    RETURN json_build_object('error', 'Order already completed');
  END IF;

  -- Update order status
  UPDATE orders
  SET status = 'completed', completed_at = NOW(), updated_at = NOW()
  WHERE id = p_order_id;

  -- Release table if exists
  IF v_table_id IS NOT NULL THEN
    UPDATE tables
    SET status = 'available', current_order_id = NULL
    WHERE id = v_table_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_order_atomic TO authenticated;

