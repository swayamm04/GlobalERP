import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Specification {
    label: string;
    value: string;
}

interface RawMaterialForm {
    name: string;
    unit: string;
    stockQuantity: number | "";
    minStockLevel: number | "";
    specifications: Specification[];
}

interface AddRawMaterialModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (material?: any) => void;
    editingMaterial?: any;
}

const AddRawMaterialModal = ({ open, onOpenChange, onSuccess, editingMaterial }: AddRawMaterialModalProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalCategory, setModalCategory] = useState("");
    const [materialForm, setMaterialForm] = useState<RawMaterialForm>({
        name: "",
        unit: "pieces",
        stockQuantity: 0,
        minStockLevel: 10,
        specifications: []
    });

    useEffect(() => {
        if (open) {
            if (editingMaterial) {
                setModalCategory(editingMaterial.category);
                setMaterialForm({
                    name: editingMaterial.name,
                    unit: editingMaterial.unit,
                    stockQuantity: editingMaterial.stockQuantity,
                    minStockLevel: editingMaterial.minStockLevel || 10,
                    specifications: editingMaterial.specifications || []
                });
            } else {
                setModalCategory("");
                setMaterialForm({
                    name: "",
                    unit: "pieces",
                    stockQuantity: 0,
                    minStockLevel: 10,
                    specifications: []
                });
            }
        }
    }, [open, editingMaterial]);

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

            let response;
            if (editingMaterial) {
                response = await api.put(`/api/raw-materials/${editingMaterial._id}`, materialData);
                toast.success("Material updated successfully!");
            } else {
                response = await api.post("/api/raw-materials", materialData);
                toast.success("Material added successfully!");
            }
            onOpenChange(false);
            onSuccess(response.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save materials");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                                    min="0"
                                    value={materialForm.minStockLevel}
                                    onChange={(e) => setMaterialForm(f => ({ ...f, minStockLevel: e.target.value === '' ? '' : Number(e.target.value) }))}
                                    onFocus={(e) => e.target.select()}
                                    onBlur={(e) => {
                                        if (e.target.value === '') setMaterialForm(f => ({ ...f, minStockLevel: 0 }));
                                    }}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm">Initial Stock Quantity</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={materialForm.stockQuantity}
                                    onChange={(e) => setMaterialForm(f => ({ ...f, stockQuantity: e.target.value === '' ? '' : Number(e.target.value) }))}
                                    onFocus={(e) => e.target.select()}
                                    onBlur={(e) => {
                                        if (e.target.value === '') setMaterialForm(f => ({ ...f, stockQuantity: 0 }));
                                    }}
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
    );
};

export default AddRawMaterialModal;
