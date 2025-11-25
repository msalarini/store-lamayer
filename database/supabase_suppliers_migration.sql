-- ============================================================================
-- FASE 4: FORNECEDORES - Migration Script
-- ============================================================================
-- Este script adiciona suporte completo para gestão de fornecedores
-- Inclui: tabela suppliers, purchases (histórico), e link com products

-- ============================================================================
-- 1. TABELA DE FORNECEDORES
-- ============================================================================

-- Criar tabela suppliers se não existir
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'Brasil',
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- ============================================================================
-- 2. ADICIONAR RELACIONAMENTO EM PRODUCTS
-- ============================================================================

-- Adicionar coluna supplier_id em products se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'supplier_id'
    ) THEN
        ALTER TABLE products ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;
        CREATE INDEX idx_products_supplier ON products(supplier_id);
    END IF;
END $$;

-- ============================================================================
-- 3. TABELA DE HISTÓRICO DE COMPRAS
-- ============================================================================

-- Criar tabela purchases (histórico de compras)
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE,
    notes TEXT,
    user_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para queries otimizadas
CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);

-- ============================================================================
-- 4. TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para suppliers
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para purchases
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. DADOS DE SEED (FORNECEDORES EXEMPLO)
-- ============================================================================

-- Inserir fornecedores exemplo (apenas se a tabela estiver vazia)
INSERT INTO suppliers (name, contact_name, email, phone, city, state, rating, notes)
SELECT * FROM (
    VALUES
        ('Especiarias do Brasil Ltda', 'João Silva', 'joao@especiasbrasil.com.br', '(11) 98765-4321', 'São Paulo', 'SP', 5, 'Fornecedor principal de temperos nacionais'),
        ('Importadora Global Spices', 'Maria Santos', 'maria@globalspices.com', '(21) 99876-5432', 'Rio de Janeiro', 'RJ', 4, 'Especializada em especiarias importadas'),
        ('Fazenda Orgânica Verde', 'Pedro Costa', 'pedro@fazendaverde.com.br', '(31) 97654-3210', 'Belo Horizonte', 'MG', 5, 'Produtos 100% orgânicos certificados'),
        ('Distribuidora Pimenta Forte', 'Ana Oliveira', 'ana@pimentaforte.com.br', '(85) 96543-2109', 'Fortaleza', 'CE', 3, 'Variedade de pimentas frescas e secas')
) AS v(name, contact_name, email, phone, city, state, rating, notes)
WHERE NOT EXISTS (SELECT 1 FROM suppliers LIMIT 1);

-- ============================================================================
-- 6. RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento (ajustar em produção)
DROP POLICY IF EXISTS "Allow all for suppliers" ON suppliers;
CREATE POLICY "Allow all for suppliers" ON suppliers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all for purchases" ON purchases;
CREATE POLICY "Allow all for purchases" ON purchases FOR ALL USING (true);

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

COMMENT ON TABLE suppliers IS 'Tabela de fornecedores de produtos';
COMMENT ON TABLE purchases IS 'Histórico de compras realizadas aos fornecedores';
COMMENT ON COLUMN products.supplier_id IS 'Fornecedor principal do produto';
