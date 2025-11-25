"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
    ShoppingCart, Search, Plus, Minus, Printer, ArrowLeft,
    X, Store, Tag, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    const [isCartOpen, setIsCartOpen] = useState(false);
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
        toast.success(`${product.name} adicionado`, { duration: 1000 });
    };

    const updateQuantity = (productId: number, newQuantity: number) => {
        if (newQuantity === 0) {
            setCart(cart.filter(item => item.product.id !== productId));
            toast.info("Item removido do carrinho");
        } else {
            setCart(cart.map(item =>
                item.product.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        }
    };

    const clearCart = () => {
        setCart([]);
        toast.info("Carrinho limpo");
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

    const formatBRL = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatPYG = (value: number) => {
        const rate = parseFloat(exchangeRate) || 0;
        return new Intl.NumberFormat('es-PY', {
            style: 'currency',
            currency: 'PYG',
            maximumFractionDigits: 0
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

            const { data: orderNumberData } = await supabase
                .rpc('generate_order_number');

            const orderNumber = orderNumberData || `ORD-${Date.now()}`;

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

            await supabase.from("logs").insert({
                action: "PEDIDO",
                details: `Pedido criado: ${orderNumber} - Total: R$ ${totalBRL.toFixed(2)}`,
                user_email: session?.user?.email,
            });

            toast.success(`Pedido ${orderNumber} criado!`);

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

            setCart([]);
            setCustomerName("");
            setCustomerPhone("");
            setIsCartOpen(false);

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
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center space-y-4">
                    <ShoppingBag className="h-12 w-12 mx-auto animate-pulse text-primary" />
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push("/dashboard")}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold">Novo Pedido</h1>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                Selecione os produtos
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCartOpen(true)}
                        className="relative gap-2"
                    >
                        <ShoppingCart className="h-4 w-4" />
                        <span className="hidden sm:inline">Carrinho</span>
                        {cartItemCount > 0 && (
                            <Badge
                                variant="destructive"
                                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                            >
                                {cartItemCount}
                            </Badge>
                        )}
                    </Button>
                </div>
            </header>

            {/* Filters */}
            <div className="border-b bg-muted/40 p-4 space-y-3">
                <div className="container">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar produtos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.name}>
                                            {cat.icon} {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 px-3 border rounded-md bg-background">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    value={exchangeRate}
                                    onChange={(e) => setExchangeRate(e.target.value)}
                                    className="w-20 border-0 p-0 h-auto focus-visible:ring-0"
                                    placeholder="Taxa"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products List */}
            <ScrollArea className="flex-1">
                <div className="container py-4 px-4">
                    {filteredProducts.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Store className="h-12w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    {searchTerm || selectedCategory !== "all"
                                        ? "Nenhum produto encontrado"
                                        : "Nenhum produto disponível"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {filteredProducts.map((product) => {
                                const cartQty = getCartQuantity(product.id);

                                return (
                                    <Card
                                        key={product.id}
                                        className="transition-all hover:shadow-md"
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-medium truncate">
                                                            {product.name}
                                                        </h3>
                                                        {product.category && (
                                                            <Badge variant="secondary" className="text-xs shrink-0">
                                                                {product.category.icon}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-baseline gap-2 text-sm">
                                                        <span className="font-semibold text-primary">
                                                            {formatBRL(product.sell_price)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatPYG(product.sell_price)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {cartQty === 0 ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addToCart(product)}
                                                        className="shrink-0"
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Adicionar
                                                    </Button>
                                                ) : (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => updateQuantity(product.id, cartQty - 1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-8 text-center font-semibold">
                                                            {cartQty}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => updateQuantity(product.id, cartQty + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Cart Sheet */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
                    <SheetHeader className="px-6 pt-6 pb-4">
                        <SheetTitle className="flex items-center justify-between">
                            <span>Carrinho</span>
                            {cart.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearCart}
                                >
                                    Limpar
                                </Button>
                            )}
                        </SheetTitle>
                        <SheetDescription>
                            {cart.length === 0
                                ? "Nenhum item no carrinho"
                                : `${cartItemCount} ${cartItemCount === 1 ? 'item' : 'itens'}`}
                        </SheetDescription>
                    </SheetHeader>

                    {cart.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center p-6">
                            <div className="text-center space-y-3">
                                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/50" />
                                <p className="text-muted-foreground">
                                    Adicione produtos ao carrinho
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <ScrollArea className="flex-1 px-6">
                                <div className="space-y-4 pb-4">
                                    {cart.map((item) => (
                                        <div key={item.product.id} className="space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.product.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatBRL(item.product.sell_price)} × {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">
                                                        {formatBRL(item.product.sell_price * item.quantity)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatPYG(item.product.sell_price * item.quantity)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="ml-auto text-destructive"
                                                    onClick={() => updateQuantity(item.product.id, 0)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Separator />
                                        </div>
                                    ))}

                                    <div className="space-y-3 pt-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="customer-name" className="text-sm">
                                                Nome do Cliente (Opcional)
                                            </Label>
                                            <Input
                                                id="customer-name"
                                                placeholder="Nome"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="customer-phone" className="text-sm">
                                                Telefone (Opcional)
                                            </Label>
                                            <Input
                                                id="customer-phone"
                                                placeholder="(00) 00000-0000"
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            <SheetFooter className="px-6 py-4 border-t">
                                <div className="w-full space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total:</span>
                                            <span>{formatBRL(totalBRL)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Guarani:</span>
                                            <span>{formatPYG(totalBRL)}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-right">
                                            Taxa: G$ {exchangeRate} = R$ 1,00
                                        </p>
                                    </div>
                                    <Button
                                        className="w-full gap-2"
                                        size="lg"
                                        onClick={createOrder}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            "Processando..."
                                        ) : (
                                            <>
                                                <Printer className="h-4 w-4" />
                                                Finalizar e Imprimir
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
