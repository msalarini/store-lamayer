-- ========================================
-- MIGRATION: UPDATE PRODUCTS SCHEMA
-- ========================================

-- 1. Remove expiry_date column
ALTER TABLE products DROP COLUMN IF EXISTS expiry_date;

-- 2. Add wholesale_price column
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10, 2) DEFAULT 0;

-- 3. Comment on new column
COMMENT ON COLUMN products.wholesale_price IS 'Preço de venda no atacado';
