import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, TrendingUp } from "lucide-react";

interface StatsCardsProps {
    totalProducts: number;
    lowStockProducts: number;
    totalStock: number;
    investedCapital: number;
    potentialRevenue: number;
}

export function StatsCards({
    totalProducts,
    lowStockProducts,
    totalStock,
    investedCapital,
    potentialRevenue
}: StatsCardsProps) {
    return (
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
    );
}
