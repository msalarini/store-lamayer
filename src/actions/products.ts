"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProductSchema = z.object({
    name: z.string().min(1),
    buy_price: z.number().min(0),
    sell_price: z.number().min(0),
    wholesale_price: z.number().optional(),
    category_id: z.number().optional(),
    supplier_id: z.number().optional(),
    min_stock: z.number().optional(),
    current_stock: z.number().optional(),
    barcode: z.string().optional(),
});

export async function createProduct(data: z.infer<typeof ProductSchema>) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    const result = ProductSchema.safeParse(data);
    if (!result.success) return { success: false, error: "Invalid data" };

    try {
        const { error } = await supabase.from("products").insert(result.data);
        if (error) throw error;

        await supabase.from("logs").insert({
            action: "PRODUTO",
            details: `Produto criado: ${result.data.name}`,
            user_email: session.user?.email,
        });

        revalidatePath("/dashboard");
        revalidatePath("/pedidos");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateProduct(id: number, data: Partial<z.infer<typeof ProductSchema>>) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const { error } = await supabase.from("products").update(data).eq("id", id);
        if (error) throw error;

        await supabase.from("logs").insert({
            action: "PRODUTO",
            details: `Produto atualizado: ID ${id}`,
            user_email: session.user?.email,
        });

        revalidatePath("/dashboard");
        revalidatePath("/pedidos");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteProduct(id: number) {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) throw error;

        await supabase.from("logs").insert({
            action: "PRODUTO",
            details: `Produto excluído: ID ${id}`,
            user_email: session.user?.email,
        });

        revalidatePath("/dashboard");
        revalidatePath("/pedidos");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
