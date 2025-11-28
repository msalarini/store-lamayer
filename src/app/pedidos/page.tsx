import { supabase } from "@/lib/supabase";
import { PedidosClient } from "@/components/pedidos/pedidos-client";

export const dynamic = 'force-dynamic';

export default async function PedidosPage() {
    // Fetch Products
    const { data: products } = await supabase
        .from("products")
        .select(`
            *,
            category:categories(id, name, icon, color),
            supplier:suppliers(id, name)
        `)
        .order("name", { ascending: true });

    // Fetch Categories
    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

    return (
        <PedidosClient
            initialProducts={products || []}
            categories={categories || []}
        />
    );
}
