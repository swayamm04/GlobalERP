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

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => Promise<void>;
    product?: any;
}

export function ProductDialog({
    open,
    onOpenChange,
    onSubmit,
    product,
}: ProductDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        stock: "",
        price: "",
        color: "",
        length: "",
        thickness: "",
        hsnCode: "",
    });
    const [customFields, setCustomFields] = useState<any[]>([]);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                category: product.category || "",
                stock: product.stock.toString(),
                price: product.price.toString(),
                color: product.color || "",
                length: product.length || "",
                thickness: product.thickness || "",
                hsnCode: product.hsnCode || "",
            });
            setCustomFields(product.customFields || []);
        } else {
            setFormData({
                name: "",
                category: "",
                stock: "",
                price: "",
                color: "",
                length: "",
                thickness: "",
                hsnCode: "",
            });
            setCustomFields([]);
        }
    }, [product, open]);

    const handleAddField = () => {
        setCustomFields([...customFields, { label: "", value: "" }]);
    };

    const handleRemoveField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const handleFieldChange = (index: number, field: string, value: string) => {
        const newFields = [...customFields];
        newFields[index] = { ...newFields[index], [field]: value };
        setCustomFields(newFields);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                stock: Number(formData.stock),
                price: Number(formData.price),
                customFields
            });
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
                    <DialogDescription>
                        {product
                            ? "Make changes to the product here."
                            : "Add a new product to your inventory."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium border-b pb-2">Basic Details</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Input
                                        id="category"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g. Sheet"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="stock">Stock</Label>
                                        <Input
                                            id="stock"
                                            type="number"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hsnCode">HSN Code</Label>
                                    <Input
                                        id="hsnCode"
                                        value={formData.hsnCode}
                                        onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium border-b pb-2">Physical Specs</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    <Input
                                        id="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        placeholder="e.g. Red"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="length">Length</Label>
                                    <Input
                                        id="length"
                                        value={formData.length}
                                        onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                                        placeholder="e.g. 12ft"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="thickness">Thickness (mm)</Label>
                                    <Input
                                        id="thickness"
                                        value={formData.thickness}
                                        onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                                        placeholder="Optional"
                                    />
                                </div>

                                <div className="pt-4 space-y-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium">Extra Fields (Optional)</h3>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddField}
                                            className="h-8"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {customFields.map((field, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <Input
                                                    placeholder="Label (e.g. Brand)"
                                                    value={field.label}
                                                    onChange={(e) => handleFieldChange(index, "label", e.target.value)}
                                                    className="flex-1 h-8 text-xs"
                                                />
                                                <Input
                                                    placeholder="Value"
                                                    value={field.value}
                                                    onChange={(e) => handleFieldChange(index, "value", e.target.value)}
                                                    className="flex-1 h-8 text-xs"
                                                />
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
                                        {customFields.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center italic">
                                                No extra fields added
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <Button type="submit" disabled={loading} className="w-32">
                            {loading ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
