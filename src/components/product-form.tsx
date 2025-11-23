"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "O nome deve ter pelo menos 2 caracteres.",
    }),
    quantity: z.coerce.number().min(0, { message: "A quantidade deve ser maior ou igual a 0." }),
    buyPrice: z.coerce.number().min(0, { message: "O preço de compra deve ser maior ou igual a 0." }),
    sellPrice: z.coerce.number().min(0, { message: "O preço de venda deve ser maior ou igual a 0." }),
});

interface ProductFormProps {
    product?: any;
    userEmail: string;
    onSuccess: () => void;
}

export function ProductForm({ product, userEmail, onSuccess }: ProductFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: product?.name || "",
            quantity: product?.quantity || 0,
            buyPrice: product?.buy_price || 0,
            sellPrice: product?.sell_price || 0,
        } as any,
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const productData = {
                name: values.name,
                quantity: values.quantity,
                buy_price: values.buyPrice,
                sell_price: values.sellPrice,
            };

            if (product) {
                // Update
                const { error } = await supabase
                    .from("products")
                    .update(productData)
                    .eq("id", product.id);

                if (error) throw error;

                // Log update
                let action = "EDICAO";
                let details = `Produto editado: ${values.name}`;
                if (product.quantity > values.quantity) {
                    action = "VENDA";
                    details = `Venda registrada: ${values.name} (-${product.quantity - values.quantity} un)`;
                }

                await supabase.from("logs").insert({
                    action,
                    details,
                    user_email: userEmail,
                });

                toast.success("Produto atualizado com sucesso");
            } else {
                // Create
                const { error } = await supabase.from("products").insert(productData);
                if (error) throw error;

                // Log creation
                await supabase.from("logs").insert({
                    action: "CRIACAO",
                    details: `Produto criado: ${values.name} (Qtd: ${values.quantity})`,
                    user_email: userEmail,
                });

                toast.success("Produto criado com sucesso");
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Algo deu errado");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Produto</FormLabel>
                            <FormControl>
                                <Input placeholder="Nome do produto" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="buyPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Preço de Compra</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="sellPrice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Preço de Venda</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Salvando..." : product ? "Atualizar Produto" : "Criar Produto"}
                </Button>
            </form>
        </Form>
    );
}
