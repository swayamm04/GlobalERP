"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Package, Boxes, Loader2, Plus, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const StockManagement = () => {
    const [rawMaterials, setRawMaterials] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [addQuantity, setAddQuantity] = useState<string>("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState("raw-materials");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rawRes, prodRes] = await Promise.all([
                api.get("/api/raw-materials"),
                api.get("/api/products")
            ]);
            setRawMaterials(rawRes.data);
            setProducts(prodRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load inventory data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem || !addQuantity || isNaN(Number(addQuantity))) {
            toast.error("Please enter a valid quantity");
            return;
        }

        setIsUpdating(true);
        try {
            const endpoint = activeTab === "raw-materials"
                ? `/api/raw-materials/${selectedItem._id}/add-stock`
                : `/api/products/${selectedItem._id}/add-stock`;

            const { data } = await api.put(endpoint, { quantity: Number(addQuantity) });

            toast.success(`Stock updated for ${data.name}`);
            setSelectedItem(data);
            setAddQuantity("");

            // Refresh counts in list
            if (activeTab === "raw-materials") {
                setRawMaterials(prev => prev.map(m => m._id === data._id ? data : m));
            } else {
                setProducts(prev => prev.map(p => p._id === data._id ? data : p));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update stock");
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredItems = (activeTab === "raw-materials" ? rawMaterials : products).filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Stock Management</h1>
                <p className="text-muted-foreground">Quickly add new stock to materials or products</p>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left Side: List and Search */}
                <Card className="col-span-12 lg:col-span-5 flex flex-col h-[600px]">
                    <CardHeader className="pb-3">
                        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedItem(null); setSearchTerm(""); }} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="raw-materials" className="gap-2">
                                    <Boxes className="h-4 w-4" />
                                    Raw Materials
                                </TabsTrigger>
                                <TabsTrigger value="products" className="gap-2">
                                    <Package className="h-4 w-4" />
                                    Products
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={`Search ${activeTab === 'raw-materials' ? 'materials' : 'products'}...`}
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto pt-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                <span>Loading items...</span>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground">
                                No items found
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredItems.map((item) => (
                                    <button
                                        key={item._id}
                                        onClick={() => { setSelectedItem(item); setAddQuantity(""); }}
                                        className={cn(
                                            "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between group",
                                            selectedItem?._id === item._id
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{item.name}</span>
                                            <span className={cn(
                                                "text-xs truncate max-w-[200px]",
                                                selectedItem?._id === item._id ? "text-primary-foreground/80" : "text-muted-foreground"
                                            )}>
                                                {item.category?.name || item.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {item.stockQuantity ?? item.stock} {item.unit || (activeTab === 'raw-materials' ? 'pcs' : 'pcs')}
                                            <ArrowRight className={cn(
                                                "h-4 w-4 transition-transform group-hover:translate-x-1",
                                                selectedItem?._id === item._id ? "text-primary-foreground" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                                            )} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Side: Update Stock */}
                <Card className="col-span-12 lg:col-span-7 h-fit">
                    <CardHeader>
                        <CardTitle>Update Stock Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedItem ? (
                            <form onSubmit={handleUpdateStock} className="space-y-6">
                                <div className="bg-muted/50 p-6 rounded-xl border flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold">{selectedItem.name}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedItem.category?.name || selectedItem.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Stock</p>
                                        <p className="text-3xl font-black text-primary">
                                            {selectedItem.stockQuantity ?? selectedItem.stock} {selectedItem.unit || 'pcs'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="add-quantity">New Stock Quantity (Add-on)</Label>
                                        <div className="flex gap-3">
                                            <div className="relative flex-1">
                                                <Plus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="add-quantity"
                                                    type="number"
                                                    placeholder="Enter quantity to add..."
                                                    className="pl-10 h-12 text-lg"
                                                    value={addQuantity}
                                                    onChange={(e) => setAddQuantity(e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    onBlur={(e) => {
                                                        if (e.target.value === "") setAddQuantity("");
                                                    }}
                                                    autoFocus
                                                />
                                            </div>
                                            <Button type="submit" size="lg" disabled={isUpdating || !addQuantity} className="h-12 px-8">
                                                {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Stock"}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {addQuantity && !isNaN(Number(addQuantity)) && (
                                                <span>New total will be: <strong>{(selectedItem.stockQuantity ?? selectedItem.stock) + Number(addQuantity)}</strong> {selectedItem.unit || 'pcs'}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border-2 border-dashed rounded-xl">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <ArrowRight className="h-6 w-6" />
                                </div>
                                <p>Please select an item from the list to update its stock</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StockManagement;
