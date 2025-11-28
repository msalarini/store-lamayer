export interface Category {
    id: number;
    name: string;
    icon?: string;
    color?: string;
    created_at?: string;
}

export interface Supplier {
    id: number;
    name: string;
    contact?: string;
    email?: string;
    created_at?: string;
}

export interface Product {
    id: number;
    name: string;
    description?: string;
    buy_price: number;
    sell_price: number;
    wholesale_price?: number;
    quantity: number;
    min_stock_level?: number;
    category_id?: number | string; // Sometimes it comes as string from forms
    supplier_id?: number | string;
    barcode?: string;
    created_at?: string;

    // Relations
    category?: Category;
    supplier?: Supplier;
}

export interface Log {
    id: number;
    action: string;
    details: string;
    user_email: string;
    created_at: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface Order {
    id: number;
    order_number: string;
    customer_name?: string;
    customer_phone?: string;
    total_brl: number;
    total_pyg: number;
    exchange_rate: number;
    status: 'pending' | 'completed' | 'cancelled';
    created_by?: string;
    created_at: string;
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price_brl: number;
    unit_price_pyg: number;
    subtotal_brl: number;
    subtotal_pyg: number;
}
