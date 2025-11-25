"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ShoppingCart, Search, Plus, Minus, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { printOrder } from "@/lib/printer";

interface Product {
    id: number;
    name: string;
    sell_price: number;
    wholesale_price: number;
    quantity: number;
    category?: { name: string; icon: string };
}

interface CartItem {
    product: Product;
    quantity: number;
}

export default function PedidosPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [exchangeRate, setExchangeRate] = useState<string>("1350");
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchProducts();
            fetchCategories();
        }
    }, [status]);

    useEffect(() => {
        let filtered = products;

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategory !== "all") {
            filtered = filtered.filter(p =>
                p.category?.name === selectedCategory
            );
        }

        setFilteredProducts(filtered);
    }, [searchTerm, selectedCategory, products]);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from("products")
            .select(`
                *,
                category:categories(id, name, icon, color)
            `)
            .order("name", { ascending: true });

        if (error) {
            toast.error("Erro ao carregar produtos");
        } else {
            setProducts(data || []);
            setFilteredProducts(data || []);
        }
    };

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("name", { ascending: true });

        if (!error && data) {
            setCategories(data);
        }
    };

    const addToCart = (product: Product) => {
        const existingItem = cart.find(item => item.product.id === product.id);

        if (existingItem) {
            setCart(cart.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { product, quantity: 1 }]);
        }
        toast.success(`${product.name} adicionado ao carrinho`);
    };

    const updateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity === 0) {
            setCart(cart.filter(item => item.product.id !== productId));
        } else {
            setCart(cart.map(item =>
                item.product.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        }
    };

    const getCartQuantity = (productId: number) => {
        const item = cart.find(item => item.product.id === productId);
        return item ? item.quantity : 0;
    };

    const calculateTotal = () => {
        const totalBRL = cart.reduce((sum, item) =>
            sum + (item.product.sell_price * item.quantity), 0
        );
        const rate = parseFloat(exchangeRate) || 0;
        const totalPYG = totalBRL * rate;

        return { totalBRL, totalPYG };
    };

    const formatPYG = (value: number) => {
        const rate = parseFloat(exchangeRate) || 0;
        return new Intl.NumberFormat('es-PY', {
            style: 'currency',
            currency: 'PYG'
        }).format(value * rate);
    };

    const createOrder = async () => {
        if (cart.length === 0) {
            toast.error("Carrinho vazio");
            return;
        }

        setIsProcessing(true);

        try {
            const rate = parseFloat(exchangeRate) || 1;
            const { totalBRL, totalPYG } = calculateTotal();

            // Gerar número do pedido
            const { data: orderNumberData } = await supabase
                .rpc('generate_order_number');

            const orderNumber = orderNumberData || `ORD-${Date.now()}`;

            // Criar pedido
            const { data: orderData, error: orderError } = await supabase
                .from("orders")
                .insert({
                    order_number: orderNumber,
                    customer_name: customerName || null,
                    customer_phone: customerPhone || null,
                    total_brl: totalBRL,
                    total_pyg: totalPYG,
                    exchange_rate: rate,
                    status: "completed",
                    created_by: session?.user?.email
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Criar itens do pedido
            const orderItems = cart.map(item => ({
                order_id: orderData.id,
                product_id: item.product.id,
                product_name: item.product.name,
                quantity: item.quantity,
                unit_price_brl: item.product.sell_price,
                unit_price_pyg: item.product.sell_price * rate,
                subtotal_brl: item.product.sell_price * item.quantity,
                subtotal_pyg: item.product.sell_price * item.quantity * rate
            }));

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // Registrar log
            await supabase.from("logs").insert({
                action: "PEDIDO",
                details: `Pedido criado: ${orderNumber} - Total: R$ ${totalBRL.toFixed(2)}`,
                user_email: session?.user?.email,
            });

            toast.success(`Pedido ${orderNumber} criado com sucesso!`);

            // Chamar impressão
            const printResult = await printOrder({
                orderNumber,
                customerName: customerName || undefined,
                customerPhone: customerPhone || undefined,
                totalBRL,
                totalPYG,
                exchangeRate: rate,
                createdAt: orderData.created_at,
                items: orderItems.map(item => ({
                    productName: item.product_name,
                    quantity: item.quantity,
                    unitPriceBRL: item.unit_price_brl,
                    unitPricePYG: item.unit_price_pyg,
                    subtotalBRL: item.subtotal_brl,
                    subtotalPYG: item.subtotal_pyg
                }))
            });

            if (printResult.success) {
                toast.success("Pedido impresso!", { icon: "🖨️" });
            } else {
                toast.warning(`Pedido salvo, mas impressão falhou: ${printResult.error}`);
            }

            // Limpar carrinho e fechar modal
            setCart([]);
            setCustomerName("");
            setCustomerPhone("");
            setIsCheckoutOpen(false);

            // TODO: Chamar impressão aqui
            // await printOrder(orderData, orderItems);

        } catch (error: any) {
            console.error("Erro ao criar pedido:", error);
            toast.error("Erro ao criar pedido: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const { totalBRL, totalPYG } = calculateTotal();
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (status === "loading") {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b sticky top-0 bg-background z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold">🛒 Novo Pedido</h1>
                                <p className="text-sm text-muted-foreground">Selecione os produtos</p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="text-lg px-4 py-2">
                            {cartItemCount} {cartItemCount === 1 ? "item" : "itens"}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 space-y-6">
                {/* Busca e Filtros */}
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar produtos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 items-center">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas Categorias</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.name}>
                                            {cat.icon} {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">Taxa G$:</span>
                                <Input
                                    type="number"
                                    value={exchangeRate}
                                    onChange={(e) => setExchangeRate(e.target.value)}
                                    className="w-24"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Produtos */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product) => {
                        const cartQty = getCartQuantity(product.id);

                        return (
                            <Card key={product.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">{product.name}</CardTitle>
                                    {product.category && (
                                        <Badge variant="outline" className="w-fit">
                                            {product.category.icon} {product.category.name}
                                        </Badge>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Preço:</span>
                                            <span className="font-semibold">R$ {product.sell_price.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Guarani:</span>
                                            <span>{formatPYG(product.sell_price)}</span>
                                        </div>
                                    </div>

                                    {cartQty === 0 ? (
                                        <Button
                                            onClick={() => addToCart(product)}
                                            className="w-full"
                                            size="sm"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Adicionar
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-between gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => updateQuantity(product.id, cartQty - 1)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="text-lg font-bold min-w-[2rem] text-center">
                                                {cartQty}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => updateQuantity(product.id, cartQty + 1)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            Nenhum produto encontrado
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Carrinho Fixo (Bottom) */}
            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 shadow-lg">
                    <div className="container mx-auto space-y-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold">R$ {totalBRL.toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">{formatPYG(totalBRL)}</p>
                            </div>
                            <Button
                                onClick={() => setIsCheckoutOpen(true)}
                                size="lg"
                                className="gap-2"
                            >
                                <ShoppingCart className="h-5 w-5" />
                                Finalizar Pedido
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Checkout */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Finalizar Pedido</DialogTitle>
                        <DialogDescription>
                            Revise os itens e complete as informações
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Itens do carrinho */}
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">Itens do Pedido</h3>
                            {cart.map((item) => (
                                <div key={item.product.id} className="flex justify-between text-sm border-b pb-2">
                                    <div>
                                        <p className="font-medium">{item.quantity}x {item.product.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            R$ {item.product.sell_price.toFixed(2)} / un
                                        </p>
                                    </div>
                                    <p className="font-semibold">
                                        R$ {(item.product.sell_price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Dados do cliente (opcional) */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">Dados do Cliente (Opcional)</h3>
                            <div className="space-y-2">
                                <Label htmlFor="customerName">Nome</Label>
                                <Input
                                    id="customerName"
                                    placeholder="Nome do cliente"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerPhone">Telefone</Label>
                                <Input
                                    id="customerPhone"
                                    placeholder="(00) 00000-0000"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Total */}
                        <div className="border-t pt-3 space-y-1">
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total (BRL):</span>
                                <span>R$ {totalBRL.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Total (PYG):</span>
                                <span>{formatPYG(totalBRL)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Taxa: G$ {exchangeRate} = R$ 1,00
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCheckoutOpen(false)}
                            disabled={isProcessing}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={createOrder}
                            disabled={isProcessing}
                            className="gap-2"
                        >
                            {isProcessing ? (
                                "Processando..."
                            ) : (
                                <>
                                    <Printer className="h-4 w-4" />
                                    Confirmar e Imprimir
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
