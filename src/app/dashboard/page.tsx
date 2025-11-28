import { supabase } from "@/lib/supabase";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
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

    // Fetch Logs
    const { data: logs } = await supabase
        .from("logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

    // Fetch Suppliers
    const { data: suppliers } = await supabase
        .from("suppliers")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

    return (
        <DashboardClient
            initialProducts={products || []}
            categories={categories || []}
            initialLogs={logs || []}
            suppliers={suppliers || []}
        />
    );
}
