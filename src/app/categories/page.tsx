"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const categorySchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().optional(),
    icon: z.string().min(1, "Ícone é obrigatório"),
    color: z.string().min(1, "Cor é obrigatória"),
});

type CategoryForm = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
    const { status } = useSession();
    const router = useRouter();
    const [categories, setCategories] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            description: "",
            icon: "",
            color: "#10B981",
        },
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchCategories();
        }
    }, [status]);

    useEffect(() => {
        if (editingCategory) {
            reset(editingCategory);
        } else {
            reset({
                name: "",
                description: "",
                icon: "",
                color: "#10B981",
            });
        }
    }, [editingCategory, reset]);

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("name", { ascending: true });

        if (error) {
            toast.error("Erro ao carregar categorias");
        } else {
            setCategories(data || []);
        }
    };

    const onSubmit = async (data: CategoryForm) => {
        try {
            if (editingCategory) {
                // Update
                const { error } = await supabase
                    .from("categories")
                    .update(data)
                    .eq("id", editingCategory.id);

                if (error) throw error;
                toast.success("Categoria atualizada!");
            } else {
                // Create
                const { error } = await supabase
                    .from("categories")
                    .insert([data]);

                if (error) throw error;
                toast.success("Categoria cadastrada!");
            }

            setIsDialogOpen(false);
            setEditingCategory(null);
            reset();
            fetchCategories();
        } catch (error) {
            toast.error("Erro ao salvar categoria");
            console.error(error);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        // Check if category has products
        const { count } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("category_id", id);

        if (count && count > 0) {
            toast.error(`Não é possível excluir a categoria "${name}" pois existem ${count} produto(s) associado(s)`);
            return;
        }

        if (confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", id);

            if (error) {
                toast.error("Erro ao excluir categoria");
            } else {
                toast.success("Categoria excluída");
                fetchCategories();
            }
        }
    };

    if (status === "loading") {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="container mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            🗂️ Categorias
                        </h1>
                        <p className="text-muted-foreground">Gerencie as categorias de produtos</p>
                    </div>
                    <Button variant="outline" onClick={() => router.push("/dashboard")}>
                        ← Voltar ao Dashboard
                    </Button>
                </div>

                {/* Categories Table */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Lista de Categorias</CardTitle>
                                <CardDescription>
                                    {categories.length} categoria{categories.length !== 1 ? "s" : ""} cadastrada{categories.length !== 1 ? "s" : ""}
                                </CardDescription>
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setEditingCategory(null)}>
                                        <Plus className="mr-2 h-4 w-4" /> Adicionar Categoria
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome *</Label>
                                            <Input id="name" {...register("name")} />
                                            {errors.name && (
                                                <p className="text-sm text-red-500">{errors.name.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Descrição</Label>
                                            <Input id="description" {...register("description")} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="icon">Ícone (Emoji) *</Label>
                                            <Input
                                                id="icon"
                                                {...register("icon")}
                                                placeholder="🌿"
                                                maxLength={2}
                                            />
                                            {errors.icon && (
                                                <p className="text-sm text-red-500">{errors.icon.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="color">Cor (Hex) *</Label>
                                            <Input
                                                id="color"
                                                type="color"
                                                {...register("color")}
                                            />
                                            {errors.color && (
                                                <p className="text-sm text-red-500">{errors.color.message}</p>
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsDialogOpen(false);
                                                    setEditingCategory(null);
                                                    reset();
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button type="submit">
                                                {editingCategory ? "Atualizar" : "Cadastrar"}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ícone</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Cor</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            Nenhuma categoria cadastrada. Adicione a primeira categoria.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell>
                                                <span className="text-2xl">{category.icon}</span>
                                            </TableCell>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell>{category.description || "-"}</TableCell>
                                            <TableCell>
                                                <Badge style={{ backgroundColor: category.color }}>
                                                    {category.color}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingCategory(category);
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
                                                    onClick={() => handleDelete(category.id, category.name)}
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
            </div>
        </div>
    );
}
