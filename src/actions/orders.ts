"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const OrderItemSchema = z.object({
    product_id: z.number(),
    product_name: z.string(),
    quantity: z.number().min(1),
    unit_price_brl: z.number(),
    unit_price_pyg: z.number(),
    subtotal_brl: z.number(),
    subtotal_pyg: z.number(),
});

const CreateOrderSchema = z.object({
    customer_name: z.string().optional(),
    customer_phone: z.string().optional(),
    total_brl: z.number().min(0),
    total_pyg: z.number().min(0),
    exchange_rate: z.number().min(0),
    items: z.array(OrderItemSchema),
});

export async function createOrder(data: z.infer<typeof CreateOrderSchema>) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return { success: false, error: "Unauthorized" };
    }

    const result = CreateOrderSchema.safeParse(data);

    if (!result.success) {
        return { success: false, error: "Invalid data" };
    }

    const { customer_name, customer_phone, total_brl, total_pyg, exchange_rate, items } = result.data;

    try {
        // Generate Order Number
        const { data: orderNumberData, error: rpcError } = await supabase.rpc('generate_order_number');

        if (rpcError) {
            console.error("RPC Error:", rpcError);
            // Fallback if RPC fails or doesn't exist
            // return { success: false, error: "Failed to generate order number" };
        }

        const orderNumber = orderNumberData || `ORD-${Date.now()}`;

        // Create Order
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                order_number: orderNumber,
                customer_name: customer_name || null,
                customer_phone: customer_phone || null,
                total_brl,
                total_pyg,
                exchange_rate,
                status: "completed",
                created_by: session.user?.email,
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Create Order Items
        const orderItems = items.map((item) => ({
            order_id: order.id,
            ...item,
        }));

        const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // Log Action
        await supabase.from("logs").insert({
            action: "PEDIDO",
            details: `Pedido criado: ${orderNumber} - Total: R$ ${total_brl.toFixed(2)}`,
            user_email: session.user?.email,
        });

        revalidatePath("/dashboard");
        revalidatePath("/pedidos");

        return { success: true, order };
    } catch (error: any) {
        console.error("Create Order Error:", error);
        return { success: false, error: error.message };
    }
}
