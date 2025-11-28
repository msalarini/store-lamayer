import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import { toast } from "sonner";

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("products")
            .select(`
                *,
                category:categories(id, name, icon, color),
                supplier:suppliers(id, name)
            `)
            .order("name", { ascending: true });

        if (error) {
            toast.error("Erro ao carregar produtos");
            console.error(error);
        } else {
            setProducts(data || []);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return { products, isLoading, refetch: fetchProducts };
}
