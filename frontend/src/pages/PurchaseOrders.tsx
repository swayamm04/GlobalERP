import React, { useState, useEffect } from "react";
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
import { Plus, Search, Receipt, Calendar, Loader2, ArrowRight, Trash2, Check, ChevronsUpDown, Eye } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const PurchaseOrders = () => {
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    supplier: "",
    deliveryDate: new Date().toISOString().split('T')[0],
    notes: "",
    items: [{ id: Date.now().toString(), name: "", quantity: 0, unit: "pieces", unitPrice: 0, amount: 0, isFetched: false }]
  });
  const [openPopoverIdx, setOpenPopoverIdx] = useState<number | null>(null);

  const fetchPOs = async () => {
    try {
      const { data } = await api.get("/api/purchase-orders");
      setPos(data);
    } catch (error) {
      console.error("Error fetching POs:", error);
      toast.error("Failed to load POs");
    } finally {
      setLoading(false);
    }
  };

  const [viewingPO, setViewingPO] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchOptions = async () => {
    try {
      const [suppRes, matRes] = await Promise.all([
        api.get("/api/suppliers"),
        api.get("/api/raw-materials")
      ]);
      setSuppliers(suppRes.data);
      setRawMaterials(matRes.data);
    } catch (error) {
      console.error("Error fetching options:", error);
    }
  };

  useEffect(() => {
    fetchPOs();
    fetchOptions();
  }, []);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), name: "", quantity: 0, unit: "pieces", unitPrice: 0, amount: 0, isFetched: false }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // No longer calculating amount from quantity * unitPrice
      // User enters amount directly now

      return { ...prev, items: newItems };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier) return toast.error("Please select a supplier");

    setIsSubmitting(true);
    try {
      const totalAmount = formData.items.reduce((acc, item) => acc + item.amount, 0);
      await api.post("/api/purchase-orders", { ...formData, totalAmount });
      toast.success("Purchase Order created!");
      setIsModalOpen(false);
      setFormData({
        supplier: "",
        deliveryDate: new Date().toISOString().split('T')[0],
        notes: "",
        items: [{ id: Date.now().toString(), name: "", quantity: 0, unit: "pieces", unitPrice: 0, amount: 0, isFetched: false }]
      });
      fetchPOs();
    } catch (error) {
      toast.error("Failed to create PO");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPOs = pos.filter(po => {
    const poNum = po.poNumber?.toLowerCase() || "";
    const supplierName = (po.supplier?.companyName || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return poNum.includes(search) || supplierName.includes(search);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage raw material procurement</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create PO
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Purchase Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select value={formData.supplier} onValueChange={(val) => setFormData(f => ({ ...f, supplier: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s._id} value={s._id}>{s.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Delivery Date</Label>
                  <Input type="date" value={formData.deliveryDate} onChange={(e) => setFormData(f => ({ ...f, deliveryDate: e.target.value }))} required />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Order Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>Add Item</Button>
                </div>
                {formData.items.map((item, idx) => (
                  <div key={item.id} className="space-y-4 border p-4 rounded-lg bg-muted/30 relative group transition-all hover:border-primary/20">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs font-semibold">Material</Label>
                        <Popover open={openPopoverIdx === idx} onOpenChange={(open) => setOpenPopoverIdx(open ? idx : null)}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between bg-background border-input text-left font-normal h-10 px-3"
                            >
                              <span className={cn(
                                "truncate",
                                !item.name && "text-muted-foreground"
                              )}>
                                {item.name || "Search Material..."}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command className="border-0">
                              <CommandInput placeholder="Type material name..." autoComplete="off" className="border-none focus:ring-0" />
                              <CommandList className="max-h-[300px]">
                                <CommandEmpty>No materials found.</CommandEmpty>
                                <CommandGroup heading="Available Materials">
                                  {rawMaterials.map((m) => (
                                    <CommandItem
                                      key={m._id}
                                      value={m.name}
                                      onSelect={() => {
                                        handleItemChange(idx, 'name', m.name);
                                        handleItemChange(idx, 'unit', m.unit || 'pieces');
                                        handleItemChange(idx, 'isFetched', true);
                                        setOpenPopoverIdx(null);
                                      }}
                                      className="group cursor-pointer transition-colors aria-selected:bg-slate-100 hover:!bg-blue-600"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          item.name === m.name ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium group-hover:!text-white">{m.name}</span>
                                        {m.specifications && m.specifications.length > 0 ? (
                                          <div className="flex flex-wrap gap-x-1 mt-0.5">
                                            {m.specifications.map((s: any, i: number) => (
                                              <span key={i} className="text-[9px] text-muted-foreground bg-muted px-1 rounded border border-muted-foreground/20 group-data-[selected=true]:text-foreground group-data-[selected=true]:border-foreground/10">
                                                {s.label}: {s.value}
                                              </span>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-[10px] text-muted-foreground group-hover:!text-blue-50">Category: {m.category} | Stock: {m.stockQuantity}</span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                  <CommandItem
                                    value="Other"
                                    onSelect={() => {
                                      handleItemChange(idx, 'name', 'Other');
                                      handleItemChange(idx, 'isFetched', false);
                                      setOpenPopoverIdx(null);
                                    }}
                                    className="group cursor-pointer text-blue-600 aria-selected:bg-slate-100 hover:!bg-blue-600 hover:!text-white"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Manual Entry
                                  </CommandItem>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {item.name === "Other" && (
                          <Input className="h-10 mt-2" placeholder="Enter Material Name" onChange={(e) => handleItemChange(idx, 'name', e.target.value)} />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={formData.items.length === 1}
                        className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-2 border-t border-border/50">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Quantity</Label>
                        <Input type="number" className="h-9" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Unit</Label>
                        <select
                          className={cn(
                            "h-9 w-full text-sm bg-background border rounded-md px-3 focus:ring-1 focus:ring-primary outline-none transition-opacity",
                            item.isFetched && "opacity-60 cursor-not-allowed bg-muted/50"
                          )}
                          disabled={item.isFetched}
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        >
                          <option value="pieces">pcs</option>
                          <option value="kg">kg</option>
                          <option value="quintal">qtl</option>
                          <option value="ton">tone</option>
                        </select>
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs font-medium">Total Amount (₹)</Label>
                        <Input
                          type="number"
                          className="h-9 font-bold"
                          value={item.amount}
                          onChange={(e) => handleItemChange(idx, 'amount', Number(e.target.value))}
                          placeholder="Enter Total Amount"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={formData.notes} onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))} placeholder="Any specific instructions..." />
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-lg font-bold">Grand Total: ₹{formData.items.reduce((acc, i) => acc + i.amount, 0).toLocaleString()}</div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Order"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pos.length}</div>
            <p className="text-sm text-muted-foreground">Total Purchase Orders</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">₹{pos.reduce((acc, p) => acc + p.totalAmount, 0).toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total Procurement Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search POs..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* PO Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            All Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredPOs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No purchase orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPOs.map((po) => (
                  <TableRow key={po._id}>
                    <TableCell className="font-medium">{po.poNumber}</TableCell>
                    <TableCell>{po.supplier?.companyName}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(po.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </TableCell>
                    <TableCell>{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('en-GB') : 'N/A'}</TableCell>
                    <TableCell className="font-semibold text-primary">₹{po.totalAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => {
                          setViewingPO(po);
                          setIsViewModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View Items
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl rounded-xl">
          {viewingPO && (
            <div className="flex flex-col bg-background">
              {/* Header */}
              <div className="p-6 border-b flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Purchase Order</h2>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{viewingPO.poNumber}</p>
                  </div>
                </div>
                <Badge variant="outline" className="px-3 py-1 border-primary/20 bg-primary/5 text-primary font-semibold">
                  Snapshot
                </Badge>
              </div>

              <div className="p-8 space-y-8">
                {/* Summary Grid */}
                <div className="grid grid-cols-3 gap-8">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-opacity-70">Supplier</p>
                    <p className="text-base font-semibold text-foreground leading-tight">
                      {viewingPO.supplier?.companyName || viewingPO.supplier}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-opacity-70">Order Date</p>
                    <p className="text-base font-semibold text-foreground">
                      {new Date(viewingPO.createdAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-opacity-70">Expected Delivery</p>
                    <p className="text-base font-semibold text-foreground">
                      {viewingPO.deliveryDate ? new Date(viewingPO.deliveryDate).toLocaleDateString('en-GB') : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Ordered Items</h3>
                    <span className="text-xs font-medium text-muted-foreground">{viewingPO.items.length} Position{viewingPO.items.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-border">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="h-10 text-[11px] uppercase font-bold text-muted-foreground">Item Name</TableHead>
                          <TableHead className="h-10 text-[11px] uppercase font-bold text-muted-foreground text-center">Qty</TableHead>
                          <TableHead className="h-10 text-[11px] uppercase font-bold text-muted-foreground text-right">Unit Price</TableHead>
                          <TableHead className="h-10 text-[11px] uppercase font-bold text-muted-foreground text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingPO.items.map((item: any, idx: number) => (
                          <TableRow key={idx} className="border-border/50">
                            <TableCell className="py-3 font-medium text-foreground">{item.name}</TableCell>
                            <TableCell className="py-3 text-center">
                              {item.quantity}
                              <span className="text-[10px] text-muted-foreground uppercase ml-1">
                                {item.unit === 'ton' ? 'tone' : (item.unit || 'pcs')}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 text-right">₹{item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell className="py-3 text-right font-semibold text-foreground">₹{item.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Footer Totals */}
                <div className="flex flex-col items-end pt-4 space-y-2">
                  <div className="flex justify-between w-full max-w-[200px] text-sm py-1">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{viewingPO.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-[200px] text-lg font-bold border-t border-border pt-2 text-primary">
                    <span>Total</span>
                    <span>₹{viewingPO.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-8 py-6 bg-muted/20 border-t flex justify-end gap-3">
                <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)} className="h-9 px-6 font-semibold shadow-sm">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
