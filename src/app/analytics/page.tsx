"use client";

import { useEffect, useState } from "react";
import { Download, TrendingUp, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#3B82F6'];

export default function AnalyticsPage() {
    const { status } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchData();
        }
    }, [status]);

    const fetchData = async () => {
        // Fetch products with categories
        const { data: productsData } = await supabase
            .from("products")
            .select(`
                *,
                category:categories(id, name, icon, color)
            `);

        // Fetch categories
        const { data: categoriesData } = await supabase
            .from("categories")
            .select("*");

        // Fetch logs  
        const { data: logsData } = await supabase
            .from("logs")
            .select("*")
            .order("created_at", { ascending: false });

        setProducts(productsData || []);
        setCategories(categoriesData || []);
        setLogs(logsData || []);
    };

    // Prepare data for charts
    const getCategoryData = () => {
        const categoryMap = new Map();

        products.forEach(product => {
            const catName = product.category?.name || "Sem Categoria";
            const current = categoryMap.get(catName) || { count: 0, value: 0 };
            categoryMap.set(catName, {
                count: current.count + 1,
                value: current.value + (product.quantity * product.sell_price || 0)
            });
        });

        return Array.from(categoryMap.entries()).map(([name, data]) => ({
            name,
            quantidade: data.count,
            valor: data.value
        }));
    };

    const getProfitByCategory = () => {
        const categoryMap = new Map();

        products.forEach(product => {
            const catName = product.category?.name || "Sem Categoria";
            const profit = (product.sell_price - product.buy_price) * product.quantity;
            const current = categoryMap.get(catName) || 0;
            categoryMap.set(catName, current + profit);
        });

        return Array.from(categoryMap.entries()).map(([name, profit]) => ({
            categoria: name,
            lucro: profit
        }));
    };

    const getStockDistribution = () => {
        return products.map(p => ({
            name: p.name,
            value: p.quantity
        })).sort((a, b) => b.value - a.value).slice(0, 10); // Top 10
    };

    // Export functions
    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(products.map(p => ({
            Nome: p.name,
            Categoria: p.category?.name || "Sem Categoria",
            Quantidade: p.quantity,
            "Preço Compra": p.buy_price,
            "Preço Venda": p.sell_price,
            "Lucro Unit.": p.sell_price - p.buy_price,
            "Margem %": ((p.sell_price - p.buy_price) / p.buy_price * 100).toFixed(2),
            "Estoque Mínimo": p.min_stock_level || 10,
            Validade: p.expiry_date || "N/A"
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");

        XLSX.writeFile(workbook, `store-lamayer-produtos-${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Produtos exportados para Excel!");
    };

    const exportLogsToCSV = () => {
        const csv = [
            ["Ação", "Detalhes", "Usuário", "Data"],
            ...logs.map(log => [
                log.action,
                log.details,
                log.user_email,
                new Date(log.created_at).toLocaleString('pt-BR')
            ])
        ].map(row => row.join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `store-lamayer-logs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success("Histórico exportado para CSV!");
    };

    const exportFinancialReport = () => {
        const totalInvested = products.reduce((sum, p) => sum + (p.quantity * p.buy_price), 0);
        const totalRevenue = products.reduce((sum, p) => sum + (p.quantity * p.sell_price), 0);
        const totalProfit = totalRevenue - totalInvested;

        const report = [
            ["RELATÓRIO FINANCEIRO - STORE LAMAYER"],
            ["Data", new Date().toLocaleDateString('pt-BR')],
            [""],
            ["RESUMO GERAL"],
            ["Capital Investido", `R$ ${totalInvested.toFixed(2)}`],
            ["Receita Potencial", `R$ ${totalRevenue.toFixed(2)}`],
            ["Lucro Projetado", `R$ ${totalProfit.toFixed(2)}`],
            ["Margem Média", `${(totalProfit / totalInvested * 100).toFixed(2)}%`],
            [""],
            ["PRODUTOS POR CATEGORIA"],
            ["Categoria", "Quantidade", "Valor Total"],
            ...getCategoryData().map(d => [d.name, d.quantidade, `R$ ${d.valor.toFixed(2)}`]),
            [""],
            ["LUCRO POR CATEGORIA"],
            ["Categoria", "Lucro"],
            ...getProfitByCategory().map(d => [d.categoria, `R$ ${d.lucro.toFixed(2)}`])
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(report);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Financeiro");

        XLSX.writeFile(workbook, `store-lamayer-relatorio-${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Relatório financeiro exportado!");
    };

    if (status === "loading") {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    const categoryData = getCategoryData();
    const profitData = getProfitByCategory();
    const stockData = getStockDistribution();

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="container mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Analytics & Relatórios</h1>
                        <p className="text-muted-foreground">Visualize dados e exporte relatórios</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportToExcel}>
                            <Download className="mr-2 h-4 w-4" /> Exporterar Produtos (Excel)
                        </Button>
                        <Button variant="outline" onClick={exportLogsToCSV}>
                            <Download className="mr-2 h-4 w-4" /> Exportar Logs (CSV)
                        </Button>
                        <Button onClick={exportFinancialReport}>
                            <Download className="mr-2 h-4 w-4" /> Relatório Financeiro
                        </Button>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Products by Category */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Produtos por Categoria
                            </CardTitle>
                            <CardDescription>Quantidade de produtos em cada categoria</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={categoryData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="quantidade" fill="#10B981" name="Quantidade" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Profit by Category */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Lucro por Categoria
                            </CardTitle>
                            <CardDescription>Lucratividade estimada por categoria</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={profitData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="categoria" />
                                    <YAxis />
                                    <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
                                    <Legend />
                                    <Bar dataKey="lucro" fill="#3B82F6" name="Lucro (R$)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Stock Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5" />
                                Distribuição do Estoque
                            </CardTitle>
                            <CardDescription>Top 10 produtos com maior quantidade</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={stockData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {stockData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Category Value Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5" />
                                Valor por Categoria
                            </CardTitle>
                            <CardDescription>Distribuição do valor do estoque</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="valor"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `R$ ${value.toFixed(2)}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Back to Dashboard */}
                <div className="flex justify-center">
                    <Button variant="outline" onClick={() => router.push("/dashboard")}>
                        Voltar ao Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}
