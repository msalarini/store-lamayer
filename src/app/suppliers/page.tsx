"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash, Building2, Star } from "lucide-react";
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

const supplierSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    contact_name: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default("Brasil"),
    rating: z.coerce.number().min(1).max(5).optional(),
    notes: z.string().optional(),
    is_active: z.boolean().default(true),
});

type SupplierForm = z.infer<typeof supplierSchema>;

export default function SuppliersPage() {
    const { status } = useSession();
    const router = useRouter();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<any | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SupplierForm>({
        resolver: zodResolver(supplierSchema),
        defaultValues: editingSupplier || {},
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchSuppliers();
        }
    }, [status]);

    useEffect(() => {
        if (editingSupplier) {
            reset(editingSupplier);
        } else {
            reset({
                country: "Brasil",
                is_active: true,
            });
        }
    }, [editingSupplier, reset]);

    const fetchSuppliers = async () => {
        const { data, error } = await supabase
            .from("suppliers")
            .select("*")
            .order("name", { ascending: true });

        if (error) {
            toast.error("Erro ao carregar fornecedores");
        } else {
            setSuppliers(data || []);
        }
    };

    const onSubmit = async (data: SupplierForm) => {
        try {
            if (editingSupplier) {
                // Update
                const { error } = await supabase
                    .from("suppliers")
                    .update(data)
                    .eq("id", editingSupplier.id);

                if (error) throw error;
                toast.success("Fornecedor atualizado!");
            } else {
                // Create
                const { error } = await supabase
                    .from("suppliers")
                    .insert([data]);

                if (error) throw error;
                toast.success("Fornecedor cadastrado!");
            }

            setIsDialogOpen(false);
            setEditingSupplier(null);
            reset();
            fetchSuppliers();
        } catch (error) {
            toast.error("Erro ao salvar fornecedor");
            console.error(error);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (confirm(`Tem certeza que deseja excluir o fornecedor "${name}"?`)) {
            const { error } = await supabase
                .from("suppliers")
                .delete()
                .eq("id", id);

            if (error) {
                toast.error("Erro ao excluir fornecedor");
            } else {
                toast.success("Fornecedor excluído");
                fetchSuppliers();
            }
        }
    };

    const renderRating = (rating?: number) => {
        if (!rating) return null;
        return (
            <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${i < rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                    />
                ))}
            </div>
        );
    };

    if (status === "loading") {
        return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="container mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Building2 className="h-8 w-8" />
                            Fornecedores
                        </h1>
                        <p className="text-muted-foreground">Gerencie seus fornecedores de produtos</p>
                    </div>
                    <Button variant="outline" onClick={() => router.push("/dashboard")}>
                        Voltar ao Dashboard
                    </Button>
                </div>

                {/* Suppliers Table */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Lista de Fornecedores</CardTitle>
                                <CardDescription>
                                    {suppliers.length} fornecedor{suppliers.length !== 1 ? "es" : ""} cadastrado{suppliers.length !== 1 ? "s" : ""}
                                </CardDescription>
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setEditingSupplier(null)}>
                                        <Plus className="mr-2 h-4 w-4" /> Adicionar Fornecedor
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <Label htmlFor="name">Nome da Empresa *</Label>
                                                <Input id="name" {...register("name")} />
                                                {errors.name && (
                                                    <p className="text-sm text-red-500">{errors.name.message}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="contact_name">Nome do Contato</Label>
                                                <Input id="contact_name" {...register("contact_name")} />
                                            </div>

                                            <div>
                                                <Label htmlFor="email">Email</Label>
                                                <Input id="email" type="email" {...register("email")} />
                                                {errors.email && (
                                                    <p className="text-sm text-red-500">{errors.email.message}</p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor="phone">Telefone</Label>
                                                <Input id="phone" {...register("phone")} placeholder="(11) 98765-4321" />
                                            </div>

                                            <div>
                                                <Label htmlFor="rating">Avaliação (1-5)</Label>
                                                <Input
                                                    id="rating"
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    {...register("rating")}
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <Label htmlFor="address">Endereço</Label>
                                                <Input id="address" {...register("address")} />
                                            </div>

                                            <div>
                                                <Label htmlFor="city">Cidade</Label>
                                                <Input id="city" {...register("city")} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label htmlFor="state">Estado</Label>
                                                    <Input id="state" {...register("state")} placeholder="SP" />
                                                </div>
                                                <div>
                                                    <Label htmlFor="country">País</Label>
                                                    <Input id="country" {...register("country")} />
                                                </div>
                                            </div>

                                            <div className="col-span-2">
                                                <Label htmlFor="notes">Observações</Label>
                                                <Input id="notes" {...register("notes")} />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsDialogOpen(false);
                                                    setEditingSupplier(null);
                                                    reset();
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button type="submit">
                                                {editingSupplier ? "Atualizar" : "Cadastrar"}
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
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Contato</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Cidade/Estado</TableHead>
                                    <TableHead>Avaliação</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                                            Nenhum fornecedor cadastrado. Adicione o primeiro fornecedor.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    suppliers.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell className="font-medium">{supplier.name}</TableCell>
                                            <TableCell>{supplier.contact_name || "-"}</TableCell>
                                            <TableCell>{supplier.email || "-"}</TableCell>
                                            <TableCell>{supplier.phone || "-"}</TableCell>
                                            <TableCell>
                                                {supplier.city && supplier.state
                                                    ? `${supplier.city}/${supplier.state}`
                                                    : supplier.city || supplier.state || "-"}
                                            </TableCell>
                                            <TableCell>{renderRating(supplier.rating)}</TableCell>
                                            <TableCell>
                                                <Badge variant={supplier.is_active ? "default" : "secondary"}>
                                                    {supplier.is_active ? "Ativo" : "Inativo"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingSupplier(supplier);
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
                                                    onClick={() => handleDelete(supplier.id, supplier.name)}
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
