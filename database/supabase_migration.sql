-- ========================================
-- STORE LAMAYER - MIGRATION SCRIPT
-- Adiciona categorias e novos campos
-- ========================================

-- ========================================
-- 1. CRIAR TABELA DE CATEGORIAS
-- ========================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 2. ADICIONAR NOVAS COLUNAS EM PRODUCTS
-- ========================================
-- Adiciona category_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Adiciona expiry_date se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'expiry_date'
    ) THEN
        ALTER TABLE products ADD COLUMN expiry_date DATE;
    END IF;
END $$;

-- Adiciona min_stock_level se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'min_stock_level'
    ) THEN
        ALTER TABLE products ADD COLUMN min_stock_level INTEGER DEFAULT 10;
    END IF;
END $$;

-- Adiciona barcode se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'barcode'
    ) THEN
        ALTER TABLE products ADD COLUMN barcode VARCHAR(50);
    END IF;
END $$;

-- Adiciona supplier se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'supplier'
    ) THEN
        ALTER TABLE products ADD COLUMN supplier VARCHAR(255);
    END IF;
END $$;

-- Adiciona notes se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'notes'
    ) THEN
        ALTER TABLE products ADD COLUMN notes TEXT;
    END IF;
END $$;

-- ========================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date);

-- ========================================
-- 4. SEED DATA - CATEGORIAS PADRÃO
-- ========================================
INSERT INTO categories (name, description, icon, color) VALUES
    ('Temperos', 'Temperos e condimentos em geral', '🧂', '#F59E0B'),
    ('Ervas', 'Ervas frescas e secas', '🌿', '#10B981'),
    ('Pimentas', 'Pimentas e condimentos picantes', '🌶️', '#EF4444'),
    ('Especiarias Doces', 'Canela, baunilha, cravo', '🍯', '#EC4899'),
    ('Sementes', 'Sementes e grãos', '🌰', '#8B5CF6'),
    ('Misturas', 'Misturas prontas de especiarias', '🎨', '#3B82F6')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 5. TRIGGER - Atualizar updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Adiciona trigger para categories se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at'
    ) THEN
        CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- O trigger de products já deve existir, mas vamos garantir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at'
    ) THEN
        CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ========================================
-- 6. VERIFICAÇÃO
-- ========================================
-- Mostra as categorias criadas
SELECT 'Categorias criadas:' as status;
SELECT id, icon, name FROM categories ORDER BY id;

-- Mostra as colunas da tabela products
SELECT 'Colunas da tabela products:' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
