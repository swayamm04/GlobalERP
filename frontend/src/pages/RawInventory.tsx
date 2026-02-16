
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
import { Plus, Search, Boxes, AlertTriangle, Loader2, Trash2, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const RawInventory = () => {
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [modalCategory, setModalCategory] = useState("");
    const [materialForm, setMaterialForm] = useState({
        name: "",
        unit: "pieces",
        stockQuantity: 0,
        minStockLevel: 10,
        specifications: [] as { label: string, value: string }[]
    });
    const [editingMaterial, setEditingMaterial] = useState<any>(null);

    useEffect(() => {
        if (!isModalOpen) {
            setEditingMaterial(null);
            setModalCategory("");
            setMaterialForm({
                name: "",
                unit: "pieces",
                stockQuantity: 0,
                minStockLevel: 10,
                specifications: []
            });
        }
    }, [isModalOpen]);

    const handleEdit = (material: any) => {
        setEditingMaterial(material);
        setModalCategory(material.category);
        setMaterialForm({
            name: material.name,
            unit: material.unit,
            stockQuantity: material.stockQuantity,
            minStockLevel: material.minStockLevel,
            specifications: material.specifications || []
        });
        setIsModalOpen(true);
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

    const addSpecification = () => {
        setMaterialForm(prev => ({
            ...prev,
            specifications: [...prev.specifications, { label: "", value: "" }]
        }));
    };

    const removeSpecification = (index: number) => {
        setMaterialForm(prev => ({
            ...prev,
            specifications: prev.specifications.filter((_, i) => i !== index)
        }));
    };

    const handleSpecChange = (index: number, field: 'label' | 'value', value: string) => {
        const newSpecs = [...materialForm.specifications];
        newSpecs[index] = { ...newSpecs[index], [field]: value };
        setMaterialForm(prev => ({ ...prev, specifications: newSpecs }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalCategory) {
            toast.error("Please enter a category");
            return;
        }

        setIsSubmitting(true);
        try {
            const materialData = {
                ...materialForm,
                category: modalCategory
            };

            if (editingMaterial) {
                await api.put(`/api/raw-materials/${editingMaterial._id}`, materialData);
                toast.success("Material updated successfully!");
            } else {
                await api.post("/api/raw-materials", materialData);
                toast.success("Material added successfully!");
            }
            setIsModalOpen(false);
            fetchMaterials();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save materials");
        } finally {
            setIsSubmitting(false);
        }
    };

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

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Material
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingMaterial ? "Edit Raw Material" : "Add New Raw Materials"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Material Category</Label>
                                <Input
                                    id="category"
                                    value={modalCategory}
                                    onChange={(e) => setModalCategory(e.target.value)}
                                    required
                                    placeholder="e.g. Metals, Plastics, Chemicals"
                                />
                            </div>

                            <div className="space-y-4 border-t pt-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm">Material Name</Label>
                                        <Input
                                            value={materialForm.name}
                                            onChange={(e) => setMaterialForm(f => ({ ...f, name: e.target.value }))}
                                            required
                                            placeholder="e.g. MS Rod 10mm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm">Unit</Label>
                                        <select
                                            className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background"
                                            value={materialForm.unit}
                                            onChange={(e) => setMaterialForm(f => ({ ...f, unit: e.target.value }))}
                                            required
                                        >
                                            <option value="pieces">Pieces (pcs)</option>
                                            <option value="kg">Kilograms (kg)</option>
                                            <option value="quintal">Quintal (qtl)</option>
                                            <option value="ton">Tone (tone)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 hidden">
                                        <Label className="text-sm text-muted-foreground">Min Stock Level</Label>
                                        <Input
                                            type="number"
                                            value={materialForm.minStockLevel}
                                            onChange={(e) => setMaterialForm(f => ({ ...f, minStockLevel: Number(e.target.value) }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm">Initial Stock Quantity</Label>
                                        <Input
                                            type="number"
                                            value={materialForm.stockQuantity}
                                            onChange={(e) => setMaterialForm(f => ({ ...f, stockQuantity: Number(e.target.value) }))}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Specifications Section */}
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold">Other Specifications (Optional)</h3>
                                        <Button type="button" variant="outline" size="sm" onClick={addSpecification} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add Specification
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {materialForm.specifications.map((spec, index) => (
                                            <div key={index} className="flex gap-3 items-end">
                                                <div className="flex-1 space-y-1.5">
                                                    <Label className="text-xs">Label</Label>
                                                    <Input
                                                        value={spec.label}
                                                        onChange={(e) => handleSpecChange(index, 'label', e.target.value)}
                                                        placeholder="e.g. Color, Size"
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-1.5">
                                                    <Label className="text-xs">Value</Label>
                                                    <Input
                                                        value={spec.value}
                                                        onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                                                        placeholder="e.g. Red, 12mm"
                                                        className="h-9"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeSpecification(index)}
                                                    className="h-9 w-9 text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingMaterial ? "Save Changes" : "Save Materials")}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
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
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(m)}
                                            >
                                                <Edit className="h-4 w-4" />
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
    );
};

export default RawInventory;
