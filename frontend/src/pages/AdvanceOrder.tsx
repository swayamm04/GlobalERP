import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { generateInvoice } from "@/lib/invoiceGenerator";

interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    category: string;
}

const AdvanceOrder = () => {
    const [customerType, setCustomerType] = useState<"Individual" | "Business">("Individual");
    const [customerName, setCustomerName] = useState("");
    const [contact, setContact] = useState("");
    const [address, setAddress] = useState("");

    // Business specific state
    const [companyName, setCompanyName] = useState("");
    const [gstin, setGstin] = useState("");
    const [stateName, setStateName] = useState("");
    const [stateCode, setStateCode] = useState("");
    const [email, setEmail] = useState("");

    // Delivery Credentials state
    const [invoiceNo, setInvoiceNo] = useState("");
    const [invoiceDate, setInvoiceDate] = useState("");
    const [deliveryNote, setDeliveryNote] = useState("");
    const [modeOfPayment, setModeOfPayment] = useState("");
    const [referenceNo, setReferenceNo] = useState("");
    const [otherReferences, setOtherReferences] = useState("");
    const [buyersOrderNo, setBuyersOrderNo] = useState("");
    const [buyersOrderDate, setBuyersOrderDate] = useState("");
    const [dispatchDocNo, setDispatchDocNo] = useState("");
    const [deliveryNoteDate, setDeliveryNoteDate] = useState("");
    const [dispatchedThrough, setDispatchedThrough] = useState("");
    const [destination, setDestination] = useState("");
    const [billOfLading, setBillOfLading] = useState("");
    const [motorVehicleNo, setMotorVehicleNo] = useState("");
    const [termsOfDelivery, setTermsOfDelivery] = useState("");

    const [availableProducts, setAvailableProducts] = useState<any[]>([]);
    const [companyDetails, setCompanyDetails] = useState<any>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

    const [subtotal, setSubtotal] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [balanceDue, setBalanceDue] = useState(0);

    const fetchData = async () => {
        try {
            const [productsRes, settingsRes] = await Promise.all([
                api.get("/api/products"),
                api.get("/api/company-settings")
            ]);
            setAvailableProducts(productsRes.data);
            setCompanyDetails(settingsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load required data");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (customerType === "Business") {
            const today = new Date().toISOString().split('T')[0];
            setInvoiceDate(today);

            if (!invoiceNo) {
                const now = new Date();
                const year = now.getFullYear().toString().slice(-2);
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                const day = now.getDate().toString().padStart(2, '0');
                const random = Math.floor(100 + Math.random() * 900);
                setInvoiceNo(`INV/${year}${month}${day}/${random}`);
            }
        }
    }, [customerType]);

    useEffect(() => {
        if (paymentMethod) {
            setModeOfPayment(paymentMethod.toUpperCase());
        }
    }, [paymentMethod]);

    useEffect(() => {
        const newSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        setSubtotal(newSubtotal);
        const total = newSubtotal - discount;
        setGrandTotal(Math.max(0, total));
        setBalanceDue(Math.max(0, total - paidAmount));
    }, [items, discount, paidAmount]);

    const addItem = () => {
        setItems([{ id: Date.now().toString(), productName: "", quantity: 1, price: 0, category: "" }, ...items]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof OrderItem, value: any) => {
        if (field === 'productName') {
            const isDuplicate = items.some(item => item.id !== id && item.productName === value);
            if (isDuplicate) {
                toast.error("This product is already added to the list");
                return;
            }
        }
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'productName') {
                    const product = availableProducts.find(p => p._id === value);
                    if (product) {
                        updatedItem.price = product.price;
                    }
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const generateInvoicePDF = (orderData: any) => {
        generateInvoice({
            ...orderData,
            paymentMethod,
            companyDetails,
            paidAmount: orderData.paidAmount,
            balanceDue: orderData.balanceDue
        });
    };

    const handleSubmit = async () => {
        const isBusiness = customerType === "Business";
        const primaryName = isBusiness ? companyName : customerName;

        if (!primaryName || !address) {
            toast.error(`Please fill in required fields (${isBusiness ? "Company Name" : "Name"}, Address)`);
            return;
        }
        if (contact && contact.length !== 10) {
            toast.error("Contact number must be exactly 10 digits");
            return;
        }
        if (items.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        try {
            const formattedItems = items.map(item => {
                const product = availableProducts.find(p => p._id === item.productName);
                return {
                    ...item,
                    category: product ? (product.category?.name || "No Category") : item.category,
                    productName: product ? product.name : item.productName,
                    customFields: product ? product.customFields : []
                };
            });

            const orderData = {
                customerName: isBusiness ? companyName : customerName,
                contact,
                address,
                items: formattedItems,
                subtotal,
                discount,
                grandTotal,
                paidAmount,
                paymentMethod,
                balanceDue,
                companyDetails,
                customerType,
                companyName,
                gstin,
                stateName,
                stateCode,
                email,
                invoiceNo,
                invoiceDate,
                deliveryNote,
                modeOfPayment,
                referenceNo,
                otherReferences,
                buyersOrderNo,
                buyersOrderDate,
                dispatchDocNo,
                deliveryNoteDate,
                dispatchedThrough,
                destination,
                billOfLading,
                motorVehicleNo,
                termsOfDelivery,
                status: 'Pending' // Always pending for Advance Orders
            };

            await api.post("/api/orders", orderData);
            generateInvoicePDF(orderData);
            toast.success("Advance order placed and invoice generated!");

            // Reset form
            setCustomerName("");
            setContact("");
            setAddress("");
            setItems([]);
            setDiscount(0);
            setPaidAmount(0);
            setCompanyName("");
            setGstin("");
            setStateName("");
            setStateCode("");
            setEmail("");
            setInvoiceNo("");
            setDeliveryNote("");
            setModeOfPayment("");
            setReferenceNo("");
            setOtherReferences("");
            setBuyersOrderNo("");
            setDispatchDocNo("");
            setDispatchedThrough("");
            setDestination("");
            setBillOfLading("");
            setMotorVehicleNo("");
            setTermsOfDelivery("");

        } catch (error) {
            console.error("Error creating order:", error);
            toast.error("Failed to place order");
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                <div>
                    <h1 className="text-2xl font-bold">Advance Order</h1>
                    <p className="text-muted-foreground">Enter advance order details below. These orders will appear in Pending Orders first.</p>
                </div>

                <Card className="shadow-md">
                    <CardContent className="p-6 space-y-8">
                        <div className="flex flex-col space-y-4">
                            <Label className="font-semibold text-lg">Customer Type</Label>
                            <RadioGroup
                                defaultValue="Individual"
                                value={customerType}
                                onValueChange={(val: any) => setCustomerType(val)}
                                className="flex gap-6 mt-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Individual" id="individual" />
                                    <Label htmlFor="individual" className="cursor-pointer">Individual</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Business" id="business" />
                                    <Label htmlFor="business" className="cursor-pointer">Business</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold border-b pb-2">
                                {customerType === "Business" ? "Business & Customer Details" : "Customer Details"}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {customerType === "Individual" ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="customerName" className="font-semibold">Customer Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="customerName"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Enter name"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName" className="font-semibold">Company Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="companyName"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="Enter company name"
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="contact" className="font-semibold">Contact</Label>
                                    <Input
                                        id="contact"
                                        value={contact}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setContact(val);
                                        }}
                                        placeholder="10-digit phone number"
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

                                {customerType === "Business" && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="gstin" className="font-semibold">GSTIN/UIN</Label>
                                            <Input
                                                id="gstin"
                                                value={gstin}
                                                onChange={(e) => setGstin(e.target.value)}
                                                placeholder="GST number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="font-semibold">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="Business email"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="stateName" className="font-semibold">State Name</Label>
                                            <Input
                                                id="stateName"
                                                value={stateName}
                                                onChange={(e) => setStateName(e.target.value)}
                                                placeholder="e.g. Karnataka"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="stateCode" className="font-semibold">State Code</Label>
                                            <Input
                                                id="stateCode"
                                                value={stateCode}
                                                onChange={(e) => setStateCode(e.target.value)}
                                                placeholder="e.g. 29"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {customerType === "Business" && (
                            <div className="space-y-6 pt-4 border-t">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    Delivery Credentials
                                    <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="deliveryNote">Delivery Note</Label>
                                        <Input
                                            id="deliveryNote"
                                            value={deliveryNote}
                                            onChange={(e) => setDeliveryNote(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="deliveryNoteDate">Delivery Note Date</Label>
                                        <Input
                                            id="deliveryNoteDate"
                                            type="date"
                                            value={deliveryNoteDate}
                                            onChange={(e) => setDeliveryNoteDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dispatchedThrough">Dispatched through</Label>
                                        <Input
                                            id="dispatchedThrough"
                                            value={dispatchedThrough}
                                            onChange={(e) => setDispatchedThrough(e.target.value)}
                                            placeholder="e.g. VEHICLE"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="destination">Destination</Label>
                                        <Input
                                            id="destination"
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            placeholder="e.g. SHIVAMOGGA"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="motorVehicleNo">Motor Vehicle No.</Label>
                                        <Input
                                            id="motorVehicleNo"
                                            value={motorVehicleNo}
                                            onChange={(e) => setMotorVehicleNo(e.target.value)}
                                            placeholder="e.g. KA17B1810"
                                        />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <Label htmlFor="termsOfDelivery">Terms of Delivery</Label>
                                        <Input
                                            id="termsOfDelivery"
                                            value={termsOfDelivery}
                                            onChange={(e) => setTermsOfDelivery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

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
                                                <Label className="font-semibold text-foreground">Product Name</Label>
                                                <Popover open={openPopoverId === item.id} onOpenChange={(open) => setOpenPopoverId(open ? item.id : null)}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className="w-full justify-between bg-muted/30 border-input text-left font-normal h-10 px-3"
                                                        >
                                                            <span className={cn(
                                                                "truncate",
                                                                !item.productName && "text-muted-foreground"
                                                            )}>
                                                                {item.productName
                                                                    ? availableProducts.find((p) => p._id === item.productName)?.name
                                                                    : "Search Product Name..."}
                                                            </span>
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[400px] p-0" align="start">
                                                        <Command className="border-0">
                                                            <CommandInput placeholder="Type a product name..." autoComplete="off" className="border-none focus:ring-0" />
                                                            <CommandList className="max-h-[300px]">
                                                                <CommandEmpty>No matching products found.</CommandEmpty>
                                                                <CommandGroup heading="Existing Products">
                                                                    {availableProducts.map((p) => (
                                                                        <CommandItem
                                                                            key={p._id}
                                                                            value={p.name}
                                                                            onSelect={() => {
                                                                                updateItem(item.id, 'productName', p._id);
                                                                                setOpenPopoverId(null);
                                                                            }}
                                                                            className="group cursor-pointer transition-colors"
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    item.productName === p._id ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium text-foreground">{p.name}</span>
                                                                                <span className="text-xs text-muted-foreground">Price: ₹{p.price} | Category: {p.category?.name || "No Category"}</span>
                                                                            </div>
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="w-full md:w-32 space-y-2">
                                                <Label>Price</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={item.price}
                                                    readOnly
                                                    className="bg-muted cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="w-full md:w-24 space-y-2">
                                                <Label>Qty</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                                                    onWheel={(e) => e.currentTarget.blur()}
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                            <div className="space-y-4">
                                {companyDetails && (
                                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                        <h4 className="text-sm font-semibold mb-1">Billing From:</h4>
                                        <p className="text-sm font-bold">{companyDetails.companyName}</p>
                                        <p className="text-xs text-muted-foreground">{companyDetails.address}</p>
                                    </div>
                                )}
                            </div>

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
                                        onWheel={(e) => e.currentTarget.blur()}
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
                                        onChange={(e) => {
                                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                                            setPaidAmount(Math.min(val, grandTotal));
                                        }}
                                        onWheel={(e) => e.currentTarget.blur()}
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
                            Place Advance Order
                        </Button>

                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdvanceOrder;
