"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Download, ShieldCheck, AlertTriangle, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function BackupPage() {
    const { status } = useSession();
    const router = useRouter();
    const [isExporting, setIsExporting] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);

    if (status === "loading") return <div>Carregando...</div>;
    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    const handleExportData = async () => {
        setIsExporting(true);
        try {
            // Fetch all data from all tables
            const { data: products } = await supabase.from("products").select("*");
            const { data: categories } = await supabase.from("categories").select("*");
            const { data: suppliers } = await supabase.from("suppliers").select("*");
            const { data: logs } = await supabase.from("logs").select("*");

            const backupData = {
                timestamp: new Date().toISOString(),
                version: "1.0",
                data: {
                    products: products || [],
                    categories: categories || [],
                    suppliers: suppliers || [],
                    logs: logs || []
                }
            };

            // Create and download JSON file
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `store-lamayer-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setLastBackup(new Date().toLocaleString('pt-BR'));
            toast.success("Backup realizado com sucesso!");
        } catch (error) {
            console.error("Erro no backup:", error);
            toast.error("Falha ao realizar backup.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="container mx-auto max-w-4xl space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <ShieldCheck className="h-8 w-8 text-primary" />
                            Backup e Segurança
                        </h1>
                        <p className="text-muted-foreground">Gerencie a segurança dos seus dados</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Export Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Exportar Dados
                            </CardTitle>
                            <CardDescription>
                                Baixe uma cópia completa do seu banco de dados em formato JSON.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900">
                                <h4 className="flex items-center gap-2 font-semibold text-yellow-800 dark:text-yellow-500 mb-1">
                                    <AlertTriangle className="h-4 w-4" /> Importante
                                </h4>
                                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                    Este arquivo contém dados sensíveis. Armazene-o em local seguro.
                                </p>
                            </div>

                            <Button
                                onClick={handleExportData}
                                disabled={isExporting}
                                className="w-full"
                            >
                                {isExporting ? (
                                    "Gerando Backup..."
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" /> Fazer Backup Completo
                                    </>
                                )}
                            </Button>

                            {lastBackup && (
                                <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Último backup: {lastBackup}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Security Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" />
                                Status de Segurança
                            </CardTitle>
                            <CardDescription>
                                Informações sobre a proteção dos seus dados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-2 bg-muted rounded">
                                    <span className="text-sm font-medium">Criptografia</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-300">Ativa (SSL/TLS)</span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-muted rounded">
                                    <span className="text-sm font-medium">Banco de Dados</span>
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-300">Supabase Cloud</span>
                                </div>
                                <div className="flex justify-between items-center p-2 bg-muted rounded">
                                    <span className="text-sm font-medium">Autenticação</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">OAuth 2.0</span>
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground mt-4">
                                * Seus dados são armazenados nos servidores seguros do Supabase com backups automáticos diários (nível de infraestrutura).
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
