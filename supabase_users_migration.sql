-- Create users table for hardcoded authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- In production, this would be hashed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert 4 hardcoded users
-- Note: In a real production environment, passwords should be hashed with bcrypt
-- For simplicity, using plain text (consider using bcrypt in production)
INSERT INTO users (name, email, password) VALUES
    ('Marcus', 'marcus@storelamayer.com', 'Marcus@2024'),
    ('Rodrigo', 'rodrigo@storelamayer.com', 'Rodrigo@2024'),
    ('Benicio', 'benicio@storelamayer.com', 'Benicio@2024'),
    ('Gabriel', 'gabriel@storelamayer.com', 'Gabriel@2024')
ON CONFLICT (email) DO NOTHING;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
