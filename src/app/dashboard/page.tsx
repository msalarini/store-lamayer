"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, LogOut, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ProductForm } from "@/components/product-form";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/theme-toggle";

// Components
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProfitCards } from "@/components/dashboard/profit-cards";
import { ProductsTable } from "@/components/dashboard/products-table";
import { LogsTable } from "@/components/dashboard/logs-table";
import { DeleteAlert } from "@/components/dashboard/delete-alert";

// Hooks
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useLogs } from "@/hooks/use-logs";
import { Product } from "@/types";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Data Hooks
    const { products, isLoading: productsLoading, refetch: refetchProducts } = useProducts();
    const { categories } = useCategories();
    const { logs, refetch: refetchLogs } = useLogs();

    // Local State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [exchangeRate, setExchangeRate] = useState<string>("1");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [currentLogsPage, setCurrentLogsPage] = useState(1);
    const logsPerPage = 5;

    // Delete State
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Filter Logic
    const filteredProducts = useMemo(() => {
        let filtered = products;

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedCategory !== "all") {
            filtered = filtered.filter(p =>
                p.category_id?.toString() === selectedCategory
            );
        }

        return filtered;
    }, [products, searchTerm, selectedCategory]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory]);

    // Calculations
    const totalProducts = filteredProducts.length;
    const totalStock = useMemo(() => filteredProducts.reduce((sum, p) => sum + (p.quantity || 0), 0), [filteredProducts]);
    const investedCapital = useMemo(() => filteredProducts.reduce((sum, p) => sum + (p.quantity * p.buy_price || 0), 0), [filteredProducts]);
    const potentialRevenue = useMemo(() => filteredProducts.reduce((sum, p) => sum + (p.quantity * p.sell_price || 0), 0), [filteredProducts]);
    const projectedProfit = potentialRevenue - investedCapital;
    const averageMargin = investedCapital > 0 ? ((projectedProfit / investedCapital) * 100) : 0;
    const lowStockProducts = useMemo(() => filteredProducts.filter(p => p.quantity < (p.min_stock_level || 10)).length, [filteredProducts]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const totalLogsPages = Math.ceil(logs.length / logsPerPage);
    const logsStartIndex = (currentLogsPage - 1) * logsPerPage;
    const logsEndIndex = logsStartIndex + logsPerPage;
    const paginatedLogs = logs.slice(logsStartIndex, logsEndIndex);

    // Handlers
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
            refetchProducts();
            refetchLogs();
        }
        setIsDeleting(false);
        setProductToDelete(null);
    };

    if (status === "loading" || productsLoading) {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

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
                        <Button variant="outline" onClick={() => router.push("/pedidos")}>
                            🛒 Pedidos
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/categories")}>
                            🗂️ Categorias
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/suppliers")}>
                            🏭 Fornecedores
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/barcodes")}>
                            🏷️ Etiquetas
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/backup")}>
                            🛡️ Backup
                        </Button>
                        <Button variant="outline" onClick={() => router.push("/analytics")}>
                            📊 Analytics
                        </Button>
                        <ThemeToggle />
                        <Button variant="ghost" size="icon" onClick={() => signOut()}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Exchange Rate Control */}
                <div className="flex justify-end">
                    <div className="flex items-center gap-2 bg-card p-2 rounded-md border shadow-sm">
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

                {/* Stats Cards */}
                <StatsCards
                    totalProducts={totalProducts}
                    lowStockProducts={lowStockProducts}
                    totalStock={totalStock}
                    investedCapital={investedCapital}
                    potentialRevenue={potentialRevenue}
                />

                {/* Profit Cards */}
                <ProfitCards
                    projectedProfit={projectedProfit}
                    averageMargin={averageMargin}
                />

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
                                                refetchProducts();
                                                refetchLogs();
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ProductsTable
                            products={paginatedProducts}
                            searchTerm={searchTerm}
                            selectedCategory={selectedCategory}
                            exchangeRate={exchangeRate}
                            onEdit={(product) => {
                                setEditingProduct(product);
                                setIsDialogOpen(true);
                            }}
                            onDelete={(product) => setProductToDelete(product)}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            startIndex={startIndex}
                            endIndex={endIndex}
                            totalProducts={filteredProducts.length}
                        />
                    </CardContent>
                </Card>

                {/* Logs Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Atividades</CardTitle>
                        <CardDescription>Ações e alterações recentes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LogsTable
                            logs={paginatedLogs}
                            currentPage={currentLogsPage}
                            totalPages={totalLogsPages}
                            onPageChange={setCurrentLogsPage}
                            startIndex={logsStartIndex}
                            endIndex={logsEndIndex}
                        />
                    </CardContent>
                </Card>
            </div>

            <DeleteAlert
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                onConfirm={executeDelete}
                isDeleting={isDeleting}
                itemName={productToDelete?.name}
            />
        </div>
    );
}

