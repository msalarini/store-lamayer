import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp } from "lucide-react";

interface ProfitCardsProps {
    projectedProfit: number;
    averageMargin: number;
}

export function ProfitCards({ projectedProfit, averageMargin }: ProfitCardsProps) {
    return (
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
    );
}
