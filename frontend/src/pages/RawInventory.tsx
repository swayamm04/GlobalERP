
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Search, Boxes, AlertTriangle, Loader2, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import AddRawMaterialModal from "@/components/raw-materials/AddRawMaterialModal";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RawInventory = () => {
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingMaterial, setEditingMaterial] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState<{ id: string, name: string } | null>(null);

    const handleEdit = (material: any) => {
        setEditingMaterial(material);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: string, name: string) => {
        setMaterialToDelete({ id, name });
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!materialToDelete) return;

        try {
            await api.delete(`/api/raw-materials/${materialToDelete.id}`);
            toast.success("Material deleted successfully");
            fetchMaterials();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete material");
        } finally {
            setIsDeleteDialogOpen(false);
            setMaterialToDelete(null);
        }
    };

    const fetchMaterials = async () => {
        try {
            const { data } = await api.get("/api/raw-materials");
            setMaterials(data);
        } catch (error) {
            console.error("Error fetching materials:", error);
            toast.error("Failed to load raw materials");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const lowStockCount = materials.filter(m => m.stockQuantity > 0 && m.stockQuantity <= m.minStockLevel).length;
    const outOfStockCount = materials.filter(m => m.stockQuantity === 0).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Raw Inventory</h1>
                    <p className="text-muted-foreground">Manage raw materials and stock levels</p>
                </div>

                <Button className="gap-2" onClick={() => {
                    setEditingMaterial(null);
                    setIsModalOpen(true);
                }}>
                    <Plus className="h-4 w-4" />
                    Add Material
                </Button>

                <AddRawMaterialModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onSuccess={fetchMaterials}
                    editingMaterial={editingMaterial}
                />
            </div>


            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{materials.length}</div>
                        <p className="text-sm text-muted-foreground">Total Materials</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-500">{lowStockCount}</div>
                        <p className="text-sm text-muted-foreground">Low Stock Items</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
                        <p className="text-sm text-muted-foreground">Out of Stock Items</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-success">
                            {materials.reduce((acc, m) => acc + m.stockQuantity, 0).toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Units in Stock</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search materials..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Boxes className="h-5 w-5" />
                        Stock Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Current Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredMaterials.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No materials found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMaterials.map((m) => (
                                    <TableRow key={m._id}>
                                        <TableCell className="font-medium">
                                            <div>
                                                {m.name}
                                                {m.specifications && m.specifications.length > 0 && (
                                                    <div className="flex flex-wrap gap-x-2 mt-1">
                                                        {m.specifications.map((s: any, i: number) => (
                                                            <span key={i} className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                                                {s.label}: {s.value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{m.category}</TableCell>
                                        <TableCell className="font-semibold">
                                            {m.stockQuantity}
                                            <span className="ml-2 text-[10px] font-bold uppercase text-primary/60">
                                                {m.unit === 'ton' ? 'tone' : m.unit}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {m.stockQuantity === 0 ? (
                                                <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
                                                    Out of Stock
                                                </Badge>
                                            ) : m.stockQuantity <= m.minStockLevel ? (
                                                <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 gap-1 border-none">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Low Stock
                                                </Badge>
                                            ) : (
                                                <Badge variant="default" className="bg-success/10 text-success hover:bg-success/20">
                                                    In Stock
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(m)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(m._id, m.name)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <span className="font-semibold text-foreground">"{materialToDelete?.name}"</span> and remove its data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Material
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default RawInventory;
