-- Add product variants support
-- Allows products to have variants with different attributes and prices
-- Example: Coffee - Pack (6 items: +₹50, 12 items: +₹90)

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  extra_price NUMERIC(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for product_variants
CREATE POLICY "Allow authenticated read product_variants" ON product_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert product_variants" ON product_variants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update product_variants" ON product_variants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete product_variants" ON product_variants FOR DELETE TO authenticated USING (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Add variant_id to order_items to track which variant was ordered
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_label TEXT;

-- Add index for variant_id
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);

COMMENT ON TABLE product_variants IS 'Product variants with attributes (e.g., Pack: 6/12 items) and extra prices';
COMMENT ON COLUMN order_items.variant_id IS 'Reference to the product variant if a variant was selected';
COMMENT ON COLUMN order_items.variant_label IS 'Human-readable variant label (e.g., "Pack: 6 items")';

