import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/api";

interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    price: number;
}

const CreateOrder = () => {
    const [customerName, setCustomerName] = useState("");
    const [contact, setContact] = useState("");
    const [address, setAddress] = useState("");
    const [attendedBy, setAttendedBy] = useState("");
    const [items, setItems] = useState<OrderItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("cash");

    const [subtotal, setSubtotal] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [balanceDue, setBalanceDue] = useState(0);

    // Add initial item
    useEffect(() => {
        // setItems([{ id: Date.now().toString(), productName: "", quantity: 1, price: 0 }]);
    }, []);

    useEffect(() => {
        const newSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        setSubtotal(newSubtotal);

        // Simple discount calculation
        const total = newSubtotal - discount;
        setGrandTotal(Math.max(0, total));

        setBalanceDue(Math.max(0, total - paidAmount));
    }, [items, discount, paidAmount]);

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), productName: "", quantity: 1, price: 0 }]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof OrderItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleSubmit = async () => {
        if (!customerName || !address) {
            toast.error("Please fill in required fields (Name, Address)");
            return;
        }
        if (items.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        try {
            const orderData = {
                customerName,
                contact,
                address,
                attendedBy,
                items,
                subtotal,
                discount,
                grandTotal,
                paidAmount,
                paymentMethod,
                balanceDue
            };

            console.log("Order Data:", orderData);
            // await api.post("/api/orders", orderData);
            toast.success("Order placed successfully!");

            // Reset form
            setCustomerName("");
            setContact("");
            setAddress("");
            setAttendedBy("");
            setItems([]);
            setDiscount(0);
            setPaidAmount(0);

        } catch (error) {
            console.error("Error creating order:", error);
            toast.error("Failed to place order");
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold">Create Order</h1>
                    <p className="text-muted-foreground">Enter order details below.</p>
                </div>

                <Card className="shadow-md">
                    <CardContent className="p-6 space-y-8">
                        {/* Customer Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="customerName" className="font-semibold">Customer Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="customerName"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Enter name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact" className="font-semibold">Contact</Label>
                                <Input
                                    id="contact"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="Phone number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address" className="font-semibold">Address <span className="text-destructive">*</span></Label>
                                <Input
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Full address"
                                />
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Order Items</h3>
                                <Button onClick={addItem} variant="default">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Product
                                </Button>
                            </div>

                            <div className="border rounded-md p-4 bg-muted/30 min-h-[100px] space-y-4">
                                {items.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">No items added. Click "Add Product" to begin.</p>
                                ) : (
                                    items.map((item, index) => (
                                        <div key={item.id} className="flex flex-col md:flex-row gap-4 items-end border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex-1 space-y-2 w-full">
                                                <Label>Product Name</Label>
                                                <Input
                                                    placeholder="Product Name"
                                                    value={item.productName}
                                                    onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="w-full md:w-32 space-y-2">
                                                <Label>Price</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={item.price}
                                                    onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="w-full md:w-24 space-y-2">
                                                <Label>Qty</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                                                    className="bg-background"
                                                />
                                            </div>
                                            <div className="w-full md:w-32 space-y-2">
                                                <Label>Total</Label>
                                                <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-muted-foreground">
                                                    {(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:bg-destructive/10 mb-0.5"
                                                onClick={() => removeItem(item.id)}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Bottom Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="attendedBy" className="font-semibold">Employee Name (Attended By)</Label>
                                    <Input
                                        id="attendedBy"
                                        placeholder="Enter name..."
                                        value={attendedBy}
                                        onChange={(e) => setAttendedBy(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Right Column - Calculations */}
                            <div className="space-y-6 bg-muted/20 p-6 rounded-lg border">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold">Subtotal:</span>
                                    <span className="text-muted-foreground">₹ {subtotal.toFixed(2)}</span>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="discount" className="text-sm font-semibold">Discount</Label>
                                    <Input
                                        id="discount"
                                        type="number"
                                        min="0"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                        className="bg-background"
                                    />
                                </div>

                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Grand Total:</span>
                                    <span>₹ {grandTotal.toFixed(2)}</span>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="paidAmount" className="text-sm font-semibold">Paid Amount</Label>
                                    <Input
                                        id="paidAmount"
                                        type="number"
                                        min="0"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                        className="bg-background"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Payment Method</Label>
                                    <RadioGroup
                                        defaultValue="cash"
                                        value={paymentMethod}
                                        onValueChange={setPaymentMethod}
                                        className="flex gap-6 mt-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="cash" id="cash" />
                                            <Label htmlFor="cash">Cash</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="online" id="online" />
                                            <Label htmlFor="online">Online</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="card" id="card" />
                                            <Label htmlFor="card">Card</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-md border border-destructive/20 text-destructive mt-4">
                                    <span className="font-bold">Balance Due:</span>
                                    <span className="font-bold text-lg">₹ {balanceDue.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            className="w-full py-6 text-lg mt-8"
                            size="lg"
                        >
                            Place Order
                        </Button>

                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default CreateOrder;
