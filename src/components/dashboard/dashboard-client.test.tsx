import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { Product, Category, Log, Supplier } from '@/types'

// Mock child components to simplify testing
vi.mock('@/components/dashboard/stats-cards', () => ({
    StatsCards: () => <div data-testid="stats-cards">Stats Cards</div>
}))
vi.mock('@/components/dashboard/profit-cards', () => ({
    ProfitCards: () => <div data-testid="profit-cards">Profit Cards</div>
}))
vi.mock('@/components/dashboard/products-table', () => ({
    ProductsTable: ({ products }: { products: Product[] }) => (
        <div data-testid="products-table">
            {products.map(p => <div key={p.id}>{p.name}</div>)}
        </div>
    )
}))
vi.mock('@/components/dashboard/logs-table', () => ({
    LogsTable: () => <div data-testid="logs-table">Logs Table</div>
}))

const mockProducts: Product[] = [
    { id: 1, name: 'Product A', category_id: 1, quantity: 10, buy_price: 10, sell_price: 20, min_stock_level: 5, created_at: '', updated_at: '', supplier_id: 1 },
    { id: 2, name: 'Product B', category_id: 2, quantity: 5, buy_price: 15, sell_price: 30, min_stock_level: 5, created_at: '', updated_at: '', supplier_id: 1 },
]

const mockCategories: Category[] = [
    { id: 1, name: 'Cat 1', icon: '📦', color: 'red', created_at: '' },
    { id: 2, name: 'Cat 2', icon: '📱', color: 'blue', created_at: '' },
]

const mockLogs: Log[] = []
const mockSuppliers: Supplier[] = []

describe('DashboardClient', () => {
    it('should render all components', () => {
        render(
            <DashboardClient
                initialProducts={mockProducts}
                categories={mockCategories}
                initialLogs={mockLogs}
                suppliers={mockSuppliers}
            />
        )

        expect(screen.getByText('Store Lamayer')).toBeInTheDocument()
        expect(screen.getByTestId('stats-cards')).toBeInTheDocument()
        expect(screen.getByTestId('profit-cards')).toBeInTheDocument()
        expect(screen.getByTestId('products-table')).toBeInTheDocument()
    })

    it('should filter products by search term', () => {
        render(
            <DashboardClient
                initialProducts={mockProducts}
                categories={mockCategories}
                initialLogs={mockLogs}
                suppliers={mockSuppliers}
            />
        )

        const searchInput = screen.getByPlaceholderText('Buscar produtos...')
        fireEvent.change(searchInput, { target: { value: 'Product A' } })

        expect(screen.getByText('Product A')).toBeInTheDocument()
        expect(screen.queryByText('Product B')).not.toBeInTheDocument()
    })
})
