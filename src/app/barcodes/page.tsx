"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BarcodeGenerator } from "@/components/barcode-generator";
import { Printer, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function BarcodesPage() {
    const { status } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isPrintMode, setIsPrintMode] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchProducts();
        }
    }, [status]);

    useEffect(() => {
        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("name", { ascending: true });

        if (error) {
            toast.error("Erro ao carregar produtos");
        } else {
            setProducts(data || []);
            setFilteredProducts(data || []);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedProducts(filteredProducts.map(p => p.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedProducts(prev => [...prev, id]);
        } else {
            setSelectedProducts(prev => prev.filter(pId => pId !== id));
        }
    };

    const handlePrint = () => {
        if (selectedProducts.length === 0) {
            toast.error("Selecione pelo menos um produto para imprimir");
            return;
        }
        setIsPrintMode(true);
        setTimeout(() => {
            window.print();
            // Optional: exit print mode after printing
            // setIsPrintMode(false);
        }, 500);
    };

    if (status === "loading") return <div>Carregando...</div>;

    // Print View
    if (isPrintMode) {
        const productsToPrint = products.filter(p => selectedProducts.includes(p.id));

        return (
            <div className="bg-white min-h-screen p-8">
                <div className="no-print fixed top-4 left-4">
                    <Button variant="outline" onClick={() => setIsPrintMode(false)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                </div>

                <div className="grid grid-cols-3 gap-8 print:grid-cols-3 print:gap-4">
                    {productsToPrint.map(product => (
                        <div key={product.id} className="border border-gray-200 p-4 rounded flex flex-col items-center justify-center text-center page-break-inside-avoid">
                            <h3 className="font-bold text-sm mb-1 truncate w-full">{product.name}</h3>
                            <div className="my-2">
                                <BarcodeGenerator value={product.id.toString().padStart(8, '0')} width={1.5} height={40} fontSize={12} />
                            </div>
                            <p className="text-xs text-gray-500">R$ {product.sell_price?.toFixed(2)}</p>
                        </div>
                    ))}
                </div>

                <style jsx global>{`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white; }
                        @page { margin: 1cm; }
                    }
                `}</style>
            </div>
        );
    }

    // Selection View
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="container mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Printer className="h-8 w-8" />
                            Etiquetas e Códigos de Barras
                        </h1>
                        <p className="text-muted-foreground">Selecione os produtos para gerar etiquetas</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push("/dashboard")}>
                            Voltar
                        </Button>
                        <Button onClick={handlePrint} disabled={selectedProducts.length === 0}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir ({selectedProducts.length})
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar produtos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="select-all"
                                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                />
                                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                    Selecionar Todos
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    className={`
                                        border rounded-lg p-4 flex items-start gap-3 cursor-pointer transition-colors
                                        ${selectedProducts.includes(product.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                                    `}
                                    onClick={() => handleSelectProduct(product.id, !selectedProducts.includes(product.id))}
                                >
                                    <Checkbox
                                        checked={selectedProducts.includes(product.id)}
                                        onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                                    />
                                    <div className="flex-1 overflow-hidden">
                                        <h3 className="font-medium truncate">{product.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            R$ {product.sell_price?.toFixed(2)} • Estoque: {product.quantity}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
