-- Migration: Add prepared tracking to order_items
-- Run this in Supabase SQL Editor

-- Add prepared field to order_items for tracking individual item completion
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS prepared BOOLEAN DEFAULT false;

-- Add prepared_at timestamp for tracking when item was prepared
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMPTZ;

-- Update realtime to include the new columns
-- (Realtime already enabled on order_items table)

-- Add closing_total to pos_sessions for tracking last closing sale
ALTER TABLE pos_sessions ADD COLUMN IF NOT EXISTS closing_total NUMERIC(10,2) DEFAULT 0;
