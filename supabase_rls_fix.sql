-- ========================================
-- FIX RLS POLICIES FOR MOCK USER
-- ========================================

-- 1. Enable RLS on tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- 2. Create permissive policies for development (allows Anon/Public access)
-- WARNING: These policies are for development only. In production, restrict to 'authenticated' role.

-- Products
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON products;
CREATE POLICY "Enable insert access for all users" ON products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON products;
CREATE POLICY "Enable update access for all users" ON products FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON products;
CREATE POLICY "Enable delete access for all users" ON products FOR DELETE USING (true);

-- Categories
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON categories;
CREATE POLICY "Enable insert access for all users" ON categories FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON categories;
CREATE POLICY "Enable update access for all users" ON categories FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON categories;
CREATE POLICY "Enable delete access for all users" ON categories FOR DELETE USING (true);

-- Logs
DROP POLICY IF EXISTS "Enable read access for all users" ON logs;
CREATE POLICY "Enable read access for all users" ON logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON logs;
CREATE POLICY "Enable insert access for all users" ON logs FOR INSERT WITH CHECK (true);

-- 3. Verify
SELECT 'RLS Policies Updated' as status;
