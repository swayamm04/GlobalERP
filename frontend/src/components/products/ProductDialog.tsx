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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { isBase12Unit } from "@/lib/calculationUtils";

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => Promise<void>;
    product?: any;
    categories: any[];
}

export function ProductDialog({
    open,
    onOpenChange,
    onSubmit,
    product,
    categories,
}: ProductDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({
        name: "",
        category: "",
        stock: "",
        price: "",
        unit: "pcs",
        cgst: "9",
        sgst: "9",
    });
    const [categoryFields, setCategoryFields] = useState<any[]>([]);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                category: typeof product.category === 'object' ? product.category._id : product.category || "",
                stock: product.stock.toString(),
                price: product.price.toString(),
                unit: product.unit || "pcs",
                cgst: (product.cgst || 9).toString(),
                sgst: (product.sgst || 9).toString(),
                calculationField: {
                    label: product.calculationField?.label || "",
                    value: (product.calculationField?.value || "").toString(),
                    unit: product.calculationField?.unit || ""
                }
            });
            // Map customFields to category fields if needed, 
            // but for simplicity I'll just load them into the state.
            // When category changes, we'll reset or populate these.
            // When category changes, we'll reset or populate these.
        } else {
            setFormData({
                name: "",
                category: "",
                stock: "",
                price: "",
                unit: "pcs",
                cgst: "9",
                sgst: "9",
                calculationField: {
                    label: "",
                    value: "",
                    unit: ""
                }
            });
            setCategoryFields([]);
        }
    }, [product, open]);


    useEffect(() => {
        if (formData.category) {
            const selectedCat = categories.find(c => c._id === formData.category);
            if (selectedCat) {
                // Initialize physicsSpecs from product if available, or empty
                const fields = selectedCat.fields.map((f: any) => {
                    const existing = product?.customFields?.find((cf: any) => cf.label === f.label);
                    return {
                        label: f.label,
                        unit: f.unit,
                        value: existing ? existing.value : ""
                    };
                });
                setCategoryFields(fields);
            }
        }
    }, [formData.category, categories, product]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                stock: Number(formData.stock),
                price: Number(formData.price),
                cgst: Number(formData.cgst),
                sgst: Number(formData.sgst),
                calculationField: {
                    ...formData.calculationField,
                    value: formData.calculationField.value // Keep as string to preserve .10 vs .1
                },
                customFields: categoryFields.map(f => ({
                    label: f.label,
                    value: f.label.toLowerCase() === 'unit' ? 'pieces' : f.value,
                    unit: f.unit
                }))
            });
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
                    <DialogDescription>
                        {product
                            ? "Make changes to the product here."
                            : "Add a new product to your inventory."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
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
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat._id} value={cat._id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit">Unit of Measurement</Label>
                                    <Select
                                        value={formData.unit}
                                        onValueChange={(value) => setFormData({ ...formData, unit: value })}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="stock">Stock</Label>
                                        <Input
                                            id="stock"
                                            type="number"
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={(e) => {
                                                if (e.target.value === "") setFormData({ ...formData, stock: "0" });
                                            }}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price (per unit)</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={(e) => {
                                                if (e.target.value === "") setFormData({ ...formData, price: "0" });
                                            }}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium border-b pb-2">Category Specific Fields</h3>
                                {categoryFields.length > 0 ? (
                                    <div className="space-y-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                                        {categoryFields.map((field, index) => {
                                            if (field.label.toLowerCase() === 'unit') return null;
                                            return (
                                                <div key={index} className="space-y-2">
                                                    <Label className="text-blue-900/70">{field.label} {field.unit ? `(${field.unit})` : ""}</Label>
                                                    <Input
                                                        className="bg-white/50 border-blue-100 placeholder:text-blue-200"
                                                        value={field.value}
                                                        onChange={(e) => {
                                                            const newFields = [...categoryFields];
                                                            newFields[index].value = e.target.value;
                                                            setCategoryFields(newFields);
                                                        }}
                                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic py-2">
                                        {formData.category ? "No specific fields for this category" : "Please select a category first"}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium border-b pb-2">Calculation Field (Optional)</h3>
                                <p className="text-[10px] text-muted-foreground italic">
                                    Used for auto-calculating total weight-based prices in estimations/orders.
                                </p>
                                <div className="space-y-3 p-3 rounded-lg border bg-zinc-50/50">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="calcLabel" className="text-xs">Label</Label>
                                            <Input
                                                id="calcLabel"
                                                size={32}
                                                className="h-8 text-xs"
                                                value={formData.calculationField?.label}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    calculationField: { ...formData.calculationField, label: e.target.value }
                                                })}
                                                placeholder="e.g. Weight"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="calcUnit" className="text-xs">Unit</Label>
                                            <Input
                                                id="calcUnit"
                                                size={32}
                                                className="h-8 text-xs"
                                                value={formData.calculationField?.unit}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    calculationField: { ...formData.calculationField, unit: e.target.value }
                                                })}
                                                placeholder="e.g. kg"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="calcValue" className="text-xs">
                                            Value per Unit (e.g. 10 kg/pc)
                                            {isBase12Unit(formData.calculationField?.unit) && (
                                                <span className="text-[10px] text-blue-400 ml-1 font-medium">b12</span>
                                            )}
                                        </Label>
                                        <Input
                                            id="calcValue"
                                            type="text"
                                            className="h-8 text-xs"
                                            placeholder="e.g. 10 or 4.10"
                                            value={formData.calculationField?.value}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                calculationField: { ...formData.calculationField, value: e.target.value }
                                            })}
                                            onFocus={(e) => e.target.select()}
                                        />
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
        </Dialog >
    );
}
