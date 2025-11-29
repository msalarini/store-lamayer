import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCartStore } from '@/store/use-cart-store'
import { Product } from '@/types'

const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    description: 'Test Description',
    buy_price: 10,
    sell_price: 20,
    quantity: 100,
    min_stock_level: 10,
    category_id: 1,
    supplier_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
}

describe('useCartStore', () => {
    beforeEach(() => {
        const { result } = renderHook(() => useCartStore())
        act(() => {
            result.current.clearCart()
        })
    })

    it('should start with an empty cart', () => {
        const { result } = renderHook(() => useCartStore())
        expect(result.current.items).toEqual([])
    })

    it('should add an item to the cart', () => {
        const { result } = renderHook(() => useCartStore())

        act(() => {
            result.current.addItem(mockProduct)
        })

        expect(result.current.items).toHaveLength(1)
        expect(result.current.items[0].product).toEqual(mockProduct)
        expect(result.current.items[0].quantity).toBe(1)
    })

    it('should increment quantity if item already exists', () => {
        const { result } = renderHook(() => useCartStore())

        act(() => {
            result.current.addItem(mockProduct)
            result.current.addItem(mockProduct)
        })

        expect(result.current.items).toHaveLength(1)
        expect(result.current.items[0].quantity).toBe(2)
    })

    it('should remove an item from the cart', () => {
        const { result } = renderHook(() => useCartStore())

        act(() => {
            result.current.addItem(mockProduct)
            result.current.removeItem(mockProduct.id)
        })

        expect(result.current.items).toHaveLength(0)
    })

    it('should update item quantity', () => {
        const { result } = renderHook(() => useCartStore())

        act(() => {
            result.current.addItem(mockProduct)
            result.current.updateQuantity(mockProduct.id, 5)
        })

        expect(result.current.items[0].quantity).toBe(5)
    })

    it('should clear the cart', () => {
        const { result } = renderHook(() => useCartStore())

        act(() => {
            result.current.addItem(mockProduct)
            result.current.clearCart()
        })

        expect(result.current.items).toHaveLength(0)
    })

    it('should calculate total items correctly', () => {
        const { result } = renderHook(() => useCartStore())

        act(() => {
            result.current.addItem(mockProduct)
            result.current.addItem(mockProduct)
        })

        expect(result.current.totalItems()).toBe(2)
    })

    it('should calculate total BRL correctly', () => {
        const { result } = renderHook(() => useCartStore())

        act(() => {
            result.current.addItem(mockProduct) // 1 * 20 = 20
            result.current.addItem(mockProduct) // 2 * 20 = 40
        })

        expect(result.current.totalBRL()).toBe(40)
    })
})
