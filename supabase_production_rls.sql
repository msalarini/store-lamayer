-- ========================================
-- PRODUCTION RLS POLICIES
-- ========================================
-- IMPORTANT: These policies are SECURE for production
-- Only authenticated users can perform operations

-- Clean up existing development policies
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert access for all users" ON products;
DROP POLICY IF EXISTS "Enable update access for all users" ON products;
DROP POLICY IF EXISTS "Enable delete access for all users" ON products;

DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable insert access for all users" ON categories;
DROP POLICY IF EXISTS "Enable update access for all users" ON categories;
DROP POLICY IF EXISTS "Enable delete access for all users" ON categories;

DROP POLICY IF EXISTS "Enable read access for all users" ON logs;
DROP POLICY IF EXISTS "Enable insert access for all users" ON logs;

-- Enable RLS on tables (if not already enabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- PRODUCTS POLICIES (Authenticated Only)
-- ========================================

-- Allow authenticated users to read all products
CREATE POLICY "Authenticated users can view products"
ON products FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create products
CREATE POLICY "Authenticated users can create products"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update products
CREATE POLICY "Authenticated users can update products"
ON products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete products
CREATE POLICY "Authenticated users can delete products"
ON products FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- CATEGORIES POLICIES (Authenticated Only)
-- ========================================

CREATE POLICY "Authenticated users can view categories"
ON categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
ON categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
ON categories FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- LOGS POLICIES (Authenticated Only)
-- ========================================

CREATE POLICY "Authenticated users can view logs"
ON logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create logs"
ON logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verify
SELECT 'Production RLS Policies Applied - Authenticated Users Only' as status;
