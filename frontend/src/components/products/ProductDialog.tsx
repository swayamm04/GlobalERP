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
        }
    }, [product, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                stock: Number(formData.stock),
                price: Number(formData.price),
            });
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
                    <DialogDescription>
                        {product
                            ? "Make changes to the product here."
                            : "Add a new product to your inventory."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="col-span-3"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Category
                            </Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
                                required
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sheet">Sheet</SelectItem>
                                    <SelectItem value="Ridge">Ridge</SelectItem>
                                    <SelectItem value="Gutter">Gutter</SelectItem>
                                    <SelectItem value="Flashing">Flashing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="color" className="text-right">
                                Color
                            </Label>
                            <Select
                                value={formData.color}
                                onValueChange={(value) => setFormData({ ...formData, color: value })}
                                required
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select color" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Red">Red</SelectItem>
                                    <SelectItem value="Blue">Blue</SelectItem>
                                    <SelectItem value="Green">Green</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="length" className="text-right">
                                Length
                            </Label>
                            <Select
                                value={formData.length}
                                onValueChange={(value) => setFormData({ ...formData, length: value })}
                                required
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select length" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10ft">10ft</SelectItem>
                                    <SelectItem value="12ft">12ft</SelectItem>
                                    <SelectItem value="20ft">20ft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="thickness" className="text-right">
                                Thickness (mm)
                            </Label>
                            <Input
                                id="thickness"
                                value={formData.thickness}
                                onChange={(e) =>
                                    setFormData({ ...formData, thickness: e.target.value })
                                }
                                className="col-span-3"
                                placeholder="Optional"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="hsnCode" className="text-right">
                                HSN Code
                            </Label>
                            <Input
                                id="hsnCode"
                                value={formData.hsnCode}
                                onChange={(e) =>
                                    setFormData({ ...formData, hsnCode: e.target.value })
                                }
                                className="col-span-3"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stock" className="text-right">
                                Stock
                            </Label>
                            <Input
                                id="stock"
                                type="number"
                                value={formData.stock}
                                onChange={(e) =>
                                    setFormData({ ...formData, stock: e.target.value })
                                }
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                Price
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                value={formData.price}
                                onChange={(e) =>
                                    setFormData({ ...formData, price: e.target.value })
                                }
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
