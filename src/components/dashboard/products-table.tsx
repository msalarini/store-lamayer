import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pencil, Trash, AlertTriangle } from "lucide-react";
import { Product } from "@/types";

interface ProductsTableProps {
    products: Product[];
    isLoading?: boolean;
    searchTerm: string;
    selectedCategory: string;
    exchangeRate: string;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    // Pagination
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    startIndex: number;
    endIndex: number;
    totalProducts: number;
}

export function ProductsTable({
    products,
    searchTerm,
    selectedCategory,
    exchangeRate,
    onEdit,
    onDelete,
    currentPage,
    totalPages,
    onPageChange,
    startIndex,
    endIndex,
    totalProducts
}: ProductsTableProps) {

    // Helper function to format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatGuarani = (value: number) => {
        const rate = parseFloat(exchangeRate) || 0;
        const pyValue = value * rate;
        return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG' }).format(pyValue);
    };

    const EmptyState = () => (
        <div className="text-center text-muted-foreground py-8">
            {searchTerm || selectedCategory !== "all"
                ? "Nenhum produto encontrado com os filtros aplicados."
                : "Nenhum produto cadastrado. Adicione o primeiro produto para começar."}
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Mobile Cards View - Hidden on Desktop */}
            <div className="md:hidden space-y-3">
                {products.length === 0 ? (
                    <EmptyState />
                ) : (
                    products.map((product) => {
                        const isLowStock = product.quantity < (product.min_stock_level || 10);
                        const unitProfit = (product.sell_price || 0) - (product.buy_price || 0);
                        const profitMargin = product.buy_price > 0
                            ? ((unitProfit / product.buy_price) * 100)
                            : 0;
                        const rate = parseFloat(exchangeRate) || 0;

                        return (
                            <Card key={product.id} className="p-4">
                                <div className="space-y-3">
                                    {/* Product Header */}
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-base truncate">{product.name}</h3>
                                            {product.category && (
                                                <Badge variant="outline" className="mt-1">
                                                    {product.category.icon} {product.category.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(product)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500"
                                                onClick={() => onDelete(product)}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Product Details Grid */}
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Estoque</p>
                                            <p className={`font-semibold ${isLowStock ? 'text-red-500' : ''}`}>
                                                {product.quantity}
                                                {isLowStock && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Preço Compra</p>
                                            <p className="font-semibold">R$ {product.buy_price?.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Venda (Un.)</p>
                                            <div>
                                                <p className="font-semibold text-primary">R$ {product.sell_price?.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    G$ {((product.sell_price || 0) * rate).toFixed(0)}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Venda (Atac.)</p>
                                            <div>
                                                <p className="font-semibold text-primary">R$ {product.wholesale_price?.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    G$ {((product.wholesale_price || 0) * rate).toFixed(0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profit Info */}
                                    <div className="pt-2 border-t">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Lucro Unit.:</span>
                                            <span className={unitProfit >= 0 ? "text-green-600 dark:text-green-500 font-semibold" : "text-red-600 dark:text-red-500 font-semibold"}>
                                                R$ {unitProfit.toFixed(2)} ({profitMargin.toFixed(0)}%)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden md:block rounded-md border">
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
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9}>
                                    <EmptyState />
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => {
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
                                                onClick={() => onEdit(product)}
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500"
                                                onClick={() => onDelete(product)}
                                                title="Excluir"
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
            </div>

            {/* Pagination Controls */}
            {totalProducts > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Mostrando {startIndex + 1}-{Math.min(endIndex, totalProducts)} de {totalProducts} produtos
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                        >
                            Primeira
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </Button>
                        <div className="flex items-center gap-2 px-3">
                            <span className="text-sm font-medium">
                                Página {currentPage} de {totalPages}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Próxima
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            Última
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
