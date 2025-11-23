-- ========================================
-- STORE LAMAYER - SUPABASE DATABASE SCHEMA
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CATEGORIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- emoji ou nome do ícone
    color VARCHAR(20), -- hex color para UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- PRODUCTS TABLE (Updated)
-- ========================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    buy_price DECIMAL(10, 2) NOT NULL,
    sell_price DECIMAL(10, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    expiry_date DATE,
    min_stock_level INTEGER DEFAULT 10, -- nível crítico de estoque
    barcode VARCHAR(50),
    supplier VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- LOGS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_email ON logs(user_email);

-- ========================================
-- ROW LEVEL SECURITY (RLS) - OPCIONAL
-- ========================================
-- Descomente se quiser ativar RLS
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- SEED DATA - CATEGORIAS PADRÃO
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
-- TRIGGER - Atualizar updated_at automaticamente
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- COMENTÁRIOS
-- ========================================
COMMENT ON TABLE categories IS 'Categorias de produtos para organização do estoque';
COMMENT ON TABLE products IS 'Produtos do estoque com informações completas';
COMMENT ON TABLE logs IS 'Registro de auditoria de todas as ações';

COMMENT ON COLUMN products.min_stock_level IS 'Quantidade mínima para alerta de estoque baixo';
COMMENT ON COLUMN products.expiry_date IS 'Data de validade do produto (importante para especiarias)';
