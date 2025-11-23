"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash, Package, DollarSign, TrendingUp, LogOut } from "lucide-react";
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
import { ProductForm } from "@/components/product-form";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("name", { ascending: true });

        if (error) {
            toast.error("Erro ao carregar produtos");
        } else {
            setProducts(data || []);
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
            fetchLogs();
        }
    }, [status]);

    const handleDelete = async (id: number, name: string) => {
        if (confirm("Tem certeza que deseja excluir este produto?")) {
            const { error } = await supabase.from("products").delete().eq("id", id);

            if (error) {
                toast.error("Erro ao excluir produto");
            } else {
                toast.success("Produto excluído");
                if (session?.user?.email) {
                    await supabase.from("logs").insert({
                        action: "EXCLUSAO",
                        details: `Produto excluído: ${name}`,
                        user_email: session.user.email,
                    });
                }
                fetchProducts();
                fetchLogs();
            }
        }
    };

    if (status === "loading") {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    // Calculate stats
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.sell_price || 0), 0);
    const lowStockProducts = products.filter(p => p.quantity < 10).length;

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
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button variant="outline" size="icon" onClick={() => signOut({ callbackUrl: "/login" })} title="Sair">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalProducts}</div>
                            <p className="text-xs text-muted-foreground">
                                {lowStockProducts} com estoque baixo
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalStock}</div>
                            <p className="text-xs text-muted-foreground">
                                Total de unidades
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                Baseado no preço de venda
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Atividades Recentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{logs.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Registros no histórico
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Products Section */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Estoque</CardTitle>
                                <CardDescription>Gerencie o catálogo de produtos</CardDescription>
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setEditingProduct(null)}>
                                        <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
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
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Estoque</TableHead>
                                    <TableHead>Preço de Compra</TableHead>
                                    <TableHead>Preço de Venda</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            Nenhum produto cadastrado. Adicione o primeiro produto para começar.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>
                                                <span className={product.quantity < 10 ? "text-red-500 font-semibold" : ""}>
                                                    {product.quantity}
                                                </span>
                                            </TableCell>
                                            <TableCell>R$ {product.buy_price?.toFixed(2)}</TableCell>
                                            <TableCell>R$ {product.sell_price?.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingProduct(product);
                                                        setIsDialogOpen(true);
                                                    }}
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500"
                                                    onClick={() => handleDelete(product.id, product.name)}
                                                    title="Excluir"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
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
        </div>
    );
}
