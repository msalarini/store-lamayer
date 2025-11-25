"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash, Package, DollarSign, TrendingUp, LogOut, Search, Filter, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductForm } from "@/components/product-form";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/theme-toggle";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [exchangeRate, setExchangeRate] = useState<string>("1"); // Use string to handle empty state

    // Delete state
    const [productToDelete, setProductToDelete] = useState<{ id: number, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    const fetchProducts = async () => {
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

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from("logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Erro ao carregar histórico");
        } else {
            setLogs(data || []);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchProducts();
            fetchCategories();
            fetchLogs();
        }
    }, [status]);

    // Filter products based on search and category
    useEffect(() => {
        let filtered = products;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Category filter
        if (selectedCategory !== "all") {
            filtered = filtered.filter(p =>
                p.category_id?.toString() === selectedCategory
            );
        }

        setFilteredProducts(filtered);
    }, [searchTerm, selectedCategory, products]);

    const confirmDelete = (product: { id: number, name: string }) => {
        setProductToDelete(product);
    };

    const executeDelete = async () => {
        if (!productToDelete) return;

        setIsDeleting(true);
        const { error } = await supabase.from("products").delete().eq("id", productToDelete.id);

        if (error) {
            toast.error("Erro ao excluir produto");
        } else {
            toast.success("Produto excluído");
            if (session?.user?.email) {
                await supabase.from("logs").insert({
                    action: "EXCLUSAO",
                    details: `Produto excluído: ${productToDelete.name}`,
                    user_email: session.user.email,
                });
            }
            fetchProducts();
            fetchLogs();
        }
        setIsDeleting(false);
        setProductToDelete(null);
    };

    // Helper function to format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatGuarani = (value: number) => {
        const rate = parseFloat(exchangeRate) || 0;
        const pyValue = value * rate;
        return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(pyValue);
    };

    if (status === "loading") {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    // Calculate stats
    const totalProducts = filteredProducts.length;
    const totalStock = filteredProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);

    // Financial calculations
    const investedCapital = filteredProducts.reduce((sum, p) => sum + (p.quantity * p.buy_price || 0), 0);
    const potentialRevenue = filteredProducts.reduce((sum, p) => sum + (p.quantity * p.sell_price || 0), 0);
    const projectedProfit = potentialRevenue - investedCapital;
    const averageMargin = investedCapital > 0
        ? ((projectedProfit / investedCapital) * 100)
        : 0;

    const lowStockProducts = filteredProducts.filter(p => p.quantity < (p.min_stock_level || 10)).length;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Store Lamayer</h1>
                        <p className="text-sm text-muted-foreground">
                            Bem-vindo, {session?.user?.email}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => router.push("/categories")}>
                            🗂️ Categorias
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/suppliers")}>
                            🏭 Fornecedores
                        </Button>
                        <span className="text-sm font-medium whitespace-nowrap">🇵🇾 Cotação Guarani:</span>
                        <Input
                            type="number"
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(e.target.value)}
                            placeholder="0"
                            className="w-32 h-9"
                        />
                    </div>
                </div>

                {/* Financial Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalProducts}</div>
                            <p className="text-xs text-muted-foreground">
                                {lowStockProducts > 0 ? `${lowStockProducts} com estoque baixo` : `${totalStock} unidades`}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Capital Investido</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ {investedCapital.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                Custo total do estoque
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Potencial</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ {potentialRevenue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                Se vender tudo
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Profit Overview Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Lucro Projetado</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${projectedProfit >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                R$ {projectedProfit.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Ganho estimado no estoque atual
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{averageMargin.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">
                                Rentabilidade média do estoque
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Products Section */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <CardTitle>Estoque</CardTitle>
                                <CardDescription>Gerencie o catálogo de produtos</CardDescription>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                                {/* Search */}
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar produtos..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>

                                {/* Category Filter */}
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-full md:w-[200px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas Categorias</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.icon} {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button onClick={() => setEditingProduct(null)}>
                                            <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                                        </DialogHeader>
                                        <ProductForm
                                            product={editingProduct}
                                            userEmail={session?.user?.email || ""}
                                            onSuccess={() => {
                                                setIsDialogOpen(false);
                                                fetchProducts();
                                                fetchLogs();
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Fornecedor</TableHead>
                                    <TableHead>Estoque</TableHead>
                                    <TableHead>Preço Compra</TableHead>
                                    <TableHead>Venda (Un.)</TableHead>
                                    <TableHead>Venda (Atacado)</TableHead>
                                    <TableHead>Lucro Unit.</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                                            {searchTerm || selectedCategory !== "all"
                                                ? "Nenhum produto encontrado com os filtros aplicados."
                                                : "Nenhum produto cadastrado. Adicione o primeiro produto para começar."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const isLowStock = product.quantity < (product.min_stock_level || 10);
                                        const unitProfit = (product.sell_price || 0) - (product.buy_price || 0);
                                        const profitMargin = product.buy_price > 0
                                            ? ((unitProfit / product.buy_price) * 100)
                                            : 0;

                                        return (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell>
                                                    {product.category && (
                                                        <Badge variant="outline">
                                                            {product.category.icon} {product.category.name}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {product.supplier ? (
                                                        <span className="text-sm text-muted-foreground">{product.supplier.name}</span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={isLowStock ? "text-red-500 font-semibold" : ""}>
                                                        {product.quantity}
                                                        {isLowStock && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{formatCurrency(product.buy_price || 0)}</span>
                                                        <span className="text-xs text-muted-foreground">{formatGuarani(product.buy_price || 0)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{formatCurrency(product.sell_price || 0)}</span>
                                                        <span className="text-xs text-muted-foreground">{formatGuarani(product.sell_price || 0)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span>{formatCurrency(product.wholesale_price || 0)}</span>
                                                        <span className="text-xs text-muted-foreground">{formatGuarani(product.wholesale_price || 0)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={unitProfit >= 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}>
                                                        {formatCurrency(unitProfit)}
                                                        <span className="text-xs text-muted-foreground ml-1">
                                                            ({profitMargin.toFixed(0)}%)
                                                        </span>
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditingProduct(product);
                                                            setIsDialogOpen(true);
                                                        }}
                                                        title="Editar"
                                                        data-testid={`edit-btn-${product.id}`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500"
                                                        onClick={() => confirmDelete(product)}
                                                        title="Excluir"
                                                        data-testid={`delete-btn-${product.id}`}
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Logs Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Atividades</CardTitle>
                        <CardDescription>Ações e alterações recentes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ação</TableHead>
                                    <TableHead>Detalhes</TableHead>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Data</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            Nenhuma atividade registrada.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-medium">{log.action}</TableCell>
                                            <TableCell>{log.details}</TableCell>
                                            <TableCell>{log.user_email}</TableCell>
                                            <TableCell>{new Date(log.created_at).toLocaleString('pt-BR')}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={!!productToDelete} onOpenChange={(open: boolean) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o produto
                            <span className="font-bold text-foreground"> {productToDelete?.name} </span>
                            e removerá seus dados dos nossos servidores.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                executeDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Excluindo..." : "Sim, excluir produto"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
