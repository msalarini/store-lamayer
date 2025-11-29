import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProduct, updateProduct, deleteProduct } from './products'
import { supabase } from '@/lib/supabase'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
    authOptions: {}
}))

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(() => Promise.resolve({ user: { email: 'test@example.com' } }))
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}))

describe('Product Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createProduct', () => {
        it('should create a product successfully', async () => {
            // Mock Supabase insert success
            vi.mocked(supabase.from).mockImplementation((table) => {
                if (table === 'products') {
                    return {
                        insert: vi.fn().mockReturnValue({ error: null })
                    } as any
                }
                if (table === 'logs') {
                    return {
                        insert: vi.fn().mockReturnValue({ error: null })
                    } as any
                }
                return {} as any
            })

            const result = await createProduct({
                name: 'New Product',
                current_stock: 10,
                buy_price: 10,
                sell_price: 20,
                wholesale_price: 15,
                min_stock: 5,
                category_id: 1,
                supplier_id: 1
            })

            expect(result.success).toBe(true)
        })

        it('should fail validation with invalid data', async () => {
            const result = await createProduct({
                name: '', // Invalid
                current_stock: -1, // Invalid (if checked, but schema only checks number)
                buy_price: -10, // Invalid
                sell_price: 20,
                wholesale_price: 15,
                min_stock: 5,
                category_id: 1,
                supplier_id: 1
            })

            expect(result.success).toBe(false)
            expect(result.error).toBe('Invalid data')
        })
    })

    describe('deleteProduct', () => {
        it('should delete a product successfully', async () => {
            // Mock Supabase delete success
            vi.mocked(supabase.from).mockImplementation((table) => {
                if (table === 'products') {
                    return {
                        delete: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ error: null })
                        })
                    } as any
                }
                if (table === 'logs') {
                    return {
                        insert: vi.fn().mockResolvedValue({ error: null })
                    } as any
                }
                return {} as any
            })

            const result = await deleteProduct(1)
            expect(result.success).toBe(true)
        })
    })
})
