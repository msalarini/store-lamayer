"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Algo deu errado!</h2>
            <p className="text-muted-foreground max-w-[500px]">
                Desculpe, encontramos um erro inesperado. Tente recarregar a página ou contate o suporte se o problema persistir.
            </p>
            <div className="flex gap-2">
                <Button onClick={() => window.location.href = "/dashboard"} variant="outline">
                    Voltar ao Dashboard
                </Button>
                <Button onClick={() => reset()}>
                    Tentar Novamente
                </Button>
            </div>
        </div>
    );
}
