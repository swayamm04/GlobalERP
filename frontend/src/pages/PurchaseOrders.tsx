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
import { Plus, Search, Receipt, Calendar, Loader2, ArrowRight } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Delivered":
      return "bg-success/10 text-success hover:bg-success/20";
    case "In Transit":
      return "bg-primary/10 text-primary hover:bg-primary/20";
    case "Processing":
      return "bg-warning/10 text-warning hover:bg-warning/20";
    case "Pending":
      return "bg-muted text-muted-foreground";
    case "Approved":
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
    case "Draft":
      return "bg-secondary text-secondary-foreground";
    default:
      return "";
  }
};

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
    deliveryDate: "",
    notes: "",
    items: [{ name: "", quantity: 0, unitPrice: 0, amount: 0 }]
  });

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
      items: [...prev.items, { name: "", quantity: 0, unitPrice: 0, amount: 0 }]
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
    }

    setFormData(prev => ({ ...prev, items: newItems }));
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
        deliveryDate: "",
        notes: "",
        items: [{ name: "", quantity: 0, unitPrice: 0, amount: 0 }]
      });
      fetchPOs();
    } catch (error) {
      toast.error("Failed to create PO");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.put(`/api/purchase-orders/${id}/status`, { status: newStatus });
      toast.success(`PO set to ${newStatus}`);
      fetchPOs();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredPOs = pos.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplier?.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
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
                    <Label>Expected Delivery</Label>
                    <Input type="date" value={formData.deliveryDate} onChange={(e) => setFormData(f => ({ ...f, deliveryDate: e.target.value }))} required />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Order Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>Add Item</Button>
                  </div>
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-lg bg-muted/30">
                      <div className="col-span-5 space-y-2">
                        <Label className="text-xs">Material</Label>
                        <Select value={item.name} onValueChange={(v) => handleItemChange(idx, 'name', v)}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Material Name" />
                          </SelectTrigger>
                          <SelectContent>
                            {rawMaterials.map(m => (
                              <SelectItem key={m._id} value={m.name}>{m.name}</SelectItem>
                            ))}
                            <SelectItem value="Other">Other (Type below)</SelectItem>
                          </SelectContent>
                        </Select>
                        {item.name === "Other" && (
                          <Input className="h-8" placeholder="Manual Name" onChange={(e) => handleItemChange(idx, 'name', e.target.value)} />
                        )}
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs">Qty</Label>
                        <Input type="number" className="h-8" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))} />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs">Price</Label>
                        <Input type="number" className="h-8" value={item.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))} />
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label className="text-xs">Total</Label>
                        <div className="h-8 flex items-center px-3 font-semibold text-sm">₹{item.amount.toLocaleString()}</div>
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
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{pos.length}</div>
              <p className="text-sm text-muted-foreground">Total POs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-warning">{pos.filter(p => p.status === 'Pending').length}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{pos.filter(p => p.status === 'In Transit').length}</div>
              <p className="text-sm text-muted-foreground">In Transit</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{pos.filter(p => p.status === 'Delivered').length}</div>
              <p className="text-sm text-muted-foreground">Delivered</p>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                          {new Date(po.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="font-semibold text-primary">₹{po.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(po.status)}>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {po.status !== 'Delivered' && (
                          <Select onValueChange={(val) => handleStatusUpdate(po._id, val)}>
                            <SelectTrigger className="w-[110px] h-8 text-[10px]">
                              <SelectValue placeholder="Update" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Approved">Approved</SelectItem>
                              <SelectItem value="In Transit">In Transit</SelectItem>
                              <SelectItem value="Delivered">Mark Delivered</SelectItem>
                              <SelectItem value="Cancelled">Cancel</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {po.status === 'Delivered' && (
                          <Badge variant="outline" className="text-success border-success/30 bg-success/5">Completed</Badge>
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

export default PurchaseOrders;
