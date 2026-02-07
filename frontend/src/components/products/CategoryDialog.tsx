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
import { Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import Cookies from "js-cookie";

interface CategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    category?: any;
}

export function CategoryDialog({
    open,
    onOpenChange,
    onSuccess,
    category,
}: CategoryDialogProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [fields, setFields] = useState<any[]>([]);

    useEffect(() => {
        if (category) {
            setName(category.name);
            setFields(category.fields || []);
        } else {
            setName("");
            setFields([]);
        }
    }, [category, open]);

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
        if (!name) {
            toast.error("Please add a category name");
            return;
        }

        setLoading(true);
        try {
            const token = Cookies.get("auth_token");
            const data = { name, fields };

            if (category) {
                await api.put(`/api/categories/${category._id}`, data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Category updated successfully");
            } else {
                await api.post("/api/categories", data, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Category created successfully");
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving category:", error);
            toast.error("Failed to save category");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
                    <DialogDescription>
                        Define fields for this product category. Fields like Color usually don't have units.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name">Category Name</Label>
                            <Input
                                id="category-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Metal Sheet, Bolt"
                                required
                            />
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">Product Fields</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddField}
                                    className="h-8"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Field
                                </Button>
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                {fields.map((field, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <div className="flex-1 space-y-1">
                                            <Input
                                                placeholder="Label (e.g. Color)"
                                                value={field.label}
                                                onChange={(e) => handleFieldChange(index, "label", e.target.value)}
                                                className="h-8 text-xs"
                                                required
                                            />
                                        </div>
                                        <div className="w-24 space-y-1">
                                            <Input
                                                placeholder="Unit (e.g. mm)"
                                                value={field.unit}
                                                onChange={(e) => handleFieldChange(index, "unit", e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveField(index)}
                                            className="h-8 w-8 text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {fields.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center italic">
                                        No custom fields defined for this category.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Category"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
