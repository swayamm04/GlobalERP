import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import { Plus, Search, Boxes, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const RawInventory = () => {
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        unit: "kg",
        minStockLevel: 10,
        stockQuantity: 0,
    });

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: id === 'minStockLevel' || id === 'stockQuantity' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post("/api/raw-materials", formData);
            toast.success("Material added successfully!");
            setIsModalOpen(false);
            setFormData({
                name: "",
                category: "",
                unit: "kg",
                minStockLevel: 10,
                stockQuantity: 0,
            });
            fetchMaterials();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add material");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const lowStockCount = materials.filter(m => m.stockQuantity <= m.minStockLevel).length;

    return (
        <DashboardLayout>
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
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Raw Material</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Material Name</Label>
                                    <Input id="name" value={formData.name} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Input id="category" value={formData.category} onChange={handleInputChange} required placeholder="e.g. Metals, Plastics" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="unit">Unit</Label>
                                        <Input id="unit" value={formData.unit} onChange={handleInputChange} required placeholder="kg, m, pcs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="minStockLevel">Min Stock Level</Label>
                                        <Input id="minStockLevel" type="number" value={formData.minStockLevel} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stockQuantity">Initial Stock</Label>
                                    <Input id="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleInputChange} required />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Material"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{materials.length}</div>
                            <p className="text-sm text-muted-foreground">Total Materials</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-warning">{lowStockCount}</div>
                            <p className="text-sm text-muted-foreground">Low Stock Items</p>
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
                                    <TableHead>Min Level</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredMaterials.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            No materials found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredMaterials.map((m) => (
                                        <TableRow key={m._id}>
                                            <TableCell className="font-medium">{m.name}</TableCell>
                                            <TableCell>{m.category}</TableCell>
                                            <TableCell className="font-semibold">{m.stockQuantity} {m.unit}</TableCell>
                                            <TableCell>{m.minStockLevel} {m.unit}</TableCell>
                                            <TableCell>
                                                {m.stockQuantity <= m.minStockLevel ? (
                                                    <Badge variant="destructive" className="gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Low Stock
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="default" className="bg-success/10 text-success hover:bg-success/20">
                                                        In Stock
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default RawInventory;
