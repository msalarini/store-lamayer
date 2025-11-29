import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrder } from './orders'
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

describe('Order Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createOrder', () => {
        it('should create an order successfully', async () => {
            // Mock Supabase calls
            vi.mocked(supabase.rpc).mockResolvedValue({ data: 'ORD-123', error: null } as any)

            vi.mocked(supabase.from).mockImplementation((table) => {
                if (table === 'orders') {
                    return {
                        insert: vi.fn().mockReturnValue({
                            select: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: { id: 1, order_number: 'ORD-123', created_at: new Date().toISOString() },
                                    error: null
                                })
                            })
                        })
                    } as any
                }
                if (table === 'order_items' || table === 'logs') {
                    return {
                        insert: vi.fn().mockResolvedValue({ error: null })
                    } as any
                }
                return {} as any
            })

            const result = await createOrder({
                customer_name: 'John Doe',
                total_brl: 100,
                total_pyg: 135000,
                exchange_rate: 1350,
                items: [
                    {
                        product_id: 1,
                        product_name: 'Test Product',
                        quantity: 1,
                        unit_price_brl: 100,
                        unit_price_pyg: 135000,
                        subtotal_brl: 100,
                        subtotal_pyg: 135000
                    }
                ]
            })

            expect(result.success).toBe(true)
            expect(result.order).toBeDefined()
            expect(result.order?.order_number).toBe('ORD-123')
        })

        it('should fail validation with invalid data', async () => {
            const result = await createOrder({
                customer_name: 'John Doe',
                total_brl: -100, // Invalid
                total_pyg: 135000,
                exchange_rate: 1350,
                items: [] // Invalid (empty)
            })

            expect(result.success).toBe(false)
            expect(result.error).toBe('Invalid data')
        })
    })
})
