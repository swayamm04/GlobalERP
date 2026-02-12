import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { Separator } from "@/components/ui/separator";

interface CategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CategoryDialog({
    open,
    onOpenChange,
    onSuccess,
}: CategoryDialogProps) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [name, setName] = useState("");
    const [hsnCode, setHsnCode] = useState("");
    const [fields, setFields] = useState<any[]>([]);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get("/api/categories");
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("Failed to fetch categories");
        }
    };

    useEffect(() => {
        if (open) {
            fetchCategories();
            resetForm();
        }
    }, [open]);

    const resetForm = () => {
        setEditingCategory(null);
        setName("");
        setHsnCode("");
        setFields([]);
    };

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setName(category.name);
        setHsnCode(category.hsnCode || "");
        setFields(category.fields || []);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;

        try {
            const token = Cookies.get("auth_token");
            await api.delete(`/api/categories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Category deleted successfully");
            fetchCategories();
            onSuccess();
            if (editingCategory?._id === id) {
                resetForm();
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            toast.error("Failed to delete category");
        }
    };

    const handleAddField = () => {
        setFields([...fields, { label: "", unit: "" }]);
    };

    const handleRemoveField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleFieldChange = (index: number, field: string, value: string) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [field]: value };
        setFields(newFields);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !hsnCode) {
            toast.error("Name and HSN Code are required");
            return;
        }

        setLoading(true);
        try {
            const token = Cookies.get("auth_token");
            const data = { name, hsnCode, fields };

            if (editingCategory) {
                await api.put(`/api/categories/${editingCategory._id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Category updated successfully");
            } else {
                await api.post("/api/categories", data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Category created successfully");
            }

            resetForm();
            fetchCategories();
            onSuccess();
        } catch (error) {
            console.error("Error saving category:", error);
            toast.error("Failed to save category");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Category Management</DialogTitle>
                    <DialogDescription>
                        Add, edit or remove product categories.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Form Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                                    {editingCategory ? "Update Category" : "New Category"}
                                </h3>
                                {editingCategory && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetForm}
                                        className="h-7 px-2 text-xs"
                                    >
                                        <X className="h-3 w-3 mr-1" />
                                        Cancel Edit
                                    </Button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category-name">Category Name</Label>
                                    <Input
                                        id="category-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Metal Sheet, Bolt"
                                        required
                                        className="h-9"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="hsn-code">HSN Number</Label>
                                    <Input
                                        id="hsn-code"
                                        value={hsnCode}
                                        onChange={(e) => setHsnCode(e.target.value)}
                                        placeholder="e.g. 7208"
                                        required
                                        className="h-9"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">Fields & Units</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddField}
                                            className="h-7 text-xs"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                        {fields.map((field, index) => (
                                            <div key={index} className="flex gap-2 items-center animate-in fade-in slide-in-from-top-1 duration-200">
                                                <Input
                                                    placeholder="Label (e.g. Color)"
                                                    value={field.label}
                                                    onChange={(e) => handleFieldChange(index, "label", e.target.value)}
                                                    className="h-8 text-xs flex-1"
                                                    required
                                                />
                                                <Input
                                                    placeholder="Unit (mm)"
                                                    value={field.unit}
                                                    onChange={(e) => handleFieldChange(index, "unit", e.target.value)}
                                                    className="h-8 text-xs w-20"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveField(index)}
                                                    className="h-8 w-8 text-destructive shrink-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {fields.length === 0 && (
                                            <div className="text-center py-4 border-2 border-dashed rounded-lg bg-muted/30">
                                                <p className="text-[10px] text-muted-foreground uppercase">
                                                    No Custom Fields
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Processing..." : editingCategory ? "Update Category" : "Add Category"}
                                </Button>
                            </form>
                        </div>

                        {/* List Section */}
                        <div className="space-y-4 border-l md:pl-8">
                            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                                Existing Categories
                            </h3>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                {categories.length > 0 ? (
                                    categories.map((cat) => (
                                        <div
                                            key={cat._id}
                                            className={`p-3 rounded-lg border flex items-center justify-between transition-all group ${editingCategory?._id === cat._id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"
                                                }`}
                                        >
                                            <div className="flex-1 min-w-0 mr-4">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-sm truncate">{cat.name}</p>
                                                    {cat.hsnCode && (
                                                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                            HSN: {cat.hsnCode}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {cat.fields?.length || 0} fields defined
                                                </p>
                                            </div>
                                            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(cat)}
                                                    className="h-7 w-7 text-primary hover:bg-primary/10"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(cat._id)}
                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 opacity-50">
                                        <p className="text-xs italic">No categories found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />
                <div className="p-4 bg-muted/20 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
