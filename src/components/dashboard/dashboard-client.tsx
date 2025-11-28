"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Plus, LogOut, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProfitCards } from "@/components/dashboard/profit-cards";
import { ProductsTable } from "@/components/dashboard/products-table";
import { LogsTable } from "@/components/dashboard/logs-table";
import { DeleteAlert } from "@/components/dashboard/delete-alert";
import { ProductForm } from "@/components/product-form";

import { Product, Category, Log, Supplier } from "@/types";
import { deleteProduct } from "@/actions/products";

interface DashboardClientProps {
    initialProducts: Product[];
    categories: Category[];
    initialLogs: Log[];
    suppliers: Supplier[];
}

export function DashboardClient({ initialProducts, categories, initialLogs, suppliers }: DashboardClientProps) {
    const { data: session } = useSession();
    const router = useRouter();

    // State
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

    // Filter Logic
    const filteredProducts = useMemo(() => {
        let filtered = initialProducts;

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
    }, [initialProducts, searchTerm, selectedCategory]);

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

    const totalLogsPages = Math.ceil(initialLogs.length / logsPerPage);
    const logsStartIndex = (currentLogsPage - 1) * logsPerPage;
    const logsEndIndex = logsStartIndex + logsPerPage;
    const paginatedLogs = initialLogs.slice(logsStartIndex, logsEndIndex);

    // Handlers
    const executeDelete = async () => {
        if (!productToDelete) return;

        setIsDeleting(true);
        const result = await deleteProduct(productToDelete.id);

        if (!result.success) {
            toast.error("Erro ao excluir produto: " + result.error);
        } else {
            toast.success("Produto excluído");
            router.refresh();
        }
        setIsDeleting(false);
        setProductToDelete(null);
    };

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
                                                router.refresh();
                                            }}
                                            categories={categories}
                                            suppliers={suppliers}
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
