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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
                const updatedItem = { ...item, [field]: value };

                // Auto-fill price if productName (ID in this context) changes
                if (field === 'productName') {
                    const product = availableProducts.find(p => p._id === value);
                    if (product) {
                        updatedItem.price = product.price;
                        // We store the ID in productName for the dropdown, 
                        // but we might want to store the actual name for the final order
                        // For now, let's just keep the reference
                    }
                }

                return updatedItem;
            }
            return item;
        }));
    };

    const generateInvoicePDF = (orderData: any) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Configuration for uniform page layout
        const drawPageDecoration = (data?: any) => {
            // Main Border for current page
            doc.setDrawColor(0);
            doc.setLineWidth(0.1);
            doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

            // Footer on every page
            doc.setFontSize(8);
            doc.setFont("helvetica", "italic");
            doc.text("This is a Computer Generated Invoice", pageWidth / 2, pageHeight - 8, { align: "center" });

            if (data && data.pageNumber > 1) {
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.text(`Page ${data.pageNumber}`, pageWidth - 15, pageHeight - 8);
            }
        };

        // Header - Tax Invoice (First Page)
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Tax Invoice", pageWidth / 2, 12, { align: "center" });
        doc.line(5, 15, pageWidth - 5, 15);

        // Top Section
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const leftCol = 8;
        doc.setFont("helvetica", "bold");
        doc.text(companyDetails?.companyName || "COMPANY NAME", leftCol, 20);
        doc.setFont("helvetica", "normal");
        const addressLines = doc.splitTextToSize(companyDetails?.address || "Address not available", 80);
        doc.text(addressLines, leftCol, 25);

        let headerY = 25 + (addressLines.length * 4);
        doc.text(`GSTIN/UIN: ${companyDetails?.gstNumber || "N/A"}`, leftCol, headerY);
        doc.text(`State Name: ${companyDetails?.stateName || "N/A"}, Code: ${companyDetails?.stateCode || "N/A"}`, leftCol, headerY + 5);

        // Top Section - Detailed Grid
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const rightColOffset = pageWidth / 2;

        // Horizontal separators for header grid
        [22, 32, 42, 52, 62, 72, 85].forEach(y => doc.line(rightColOffset, y, pageWidth - 5, y));

        // Right Column Content - Grid fields
        doc.text("Invoice No.", rightColOffset + 2, 19);
        doc.setFont("helvetica", "bold");
        doc.text(`#ORD-${Date.now().toString().slice(-6)}`, rightColOffset + 2, 21.5);

        doc.setFont("helvetica", "normal");
        doc.text("Dated", rightColOffset + 35, 19);
        doc.setFont("helvetica", "bold");
        doc.text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }), rightColOffset + 35, 21.5);

        doc.setFont("helvetica", "normal");
        doc.text("Delivery Note", rightColOffset + 2, 26);
        doc.text("Mode/Terms of Payment", rightColOffset + 35, 26);
        doc.setFont("helvetica", "bold");
        doc.text(paymentMethod.toUpperCase(), rightColOffset + 35, 30);

        doc.setFont("helvetica", "normal");
        doc.text("Reference No. & Date", rightColOffset + 2, 36);
        doc.text("Other References", rightColOffset + 35, 36);

        doc.text("Buyer's Order No.", rightColOffset + 2, 46);
        doc.text("Dated", rightColOffset + 35, 46);

        doc.text("Dispatch Doc No.", rightColOffset + 2, 56);
        doc.text("Delivery Note Date", rightColOffset + 35, 56);

        doc.text("Dispatched through", rightColOffset + 2, 66);
        doc.text("Destination", rightColOffset + 35, 66);
        doc.setFont("helvetica", "bold");
        doc.text(address.split(',').pop()?.trim() || "N/A", rightColOffset + 35, 70);

        doc.setFont("helvetica", "normal");
        doc.text("Terms of Delivery", rightColOffset + 2, 76);
        doc.text("Motor Vehicle No.", rightColOffset + 35, 76);

        // Buyer Details
        doc.setFont("helvetica", "bold");
        doc.text("Buyer (Bill to)", leftCol, headerY + 15);
        doc.text(customerName, leftCol, headerY + 20);
        doc.setFont("helvetica", "normal");
        const buyerAddr = doc.splitTextToSize(address, 80);
        doc.text(buyerAddr, leftCol, headerY + 25);
        doc.text(`Contact: ${contact}`, leftCol, headerY + 25 + (buyerAddr.length * 4));

        doc.line(pageWidth / 2, 15, pageWidth / 2, 85);
        doc.line(5, 85, pageWidth - 5, 85);

        // Items Table with Multi-page Support
        const tableData = items.map((item, index) => {
            const product = availableProducts.find(p => p._id === item.productName);
            const rateExclTax = item.price / 1.18;
            return [
                index + 1,
                product?.name || item.productName,
                product?.hsnCode || "N/A",
                `${item.quantity} NO`,
                item.price.toFixed(2),
                rateExclTax.toFixed(2),
                "NO",
                (rateExclTax * item.quantity).toFixed(2)
            ];
        });

        autoTable(doc, {
            startY: 85,
            head: [['SI No', 'Description of Goods', 'HSN/SAC', 'Quantity', 'Rate (Incl. Tax)', 'Rate', 'per', 'Amount']],
            body: tableData,
            theme: 'plain',
            styles: { fontSize: 7, cellPadding: 2, font: "helvetica", lineWidth: 0.1, lineColor: [0, 0, 0] },
            headStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 8 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 18 },
                3: { cellWidth: 18, halign: 'center' },
                4: { cellWidth: 20, halign: 'right' },
                5: { cellWidth: 20, halign: 'right' },
                6: { cellWidth: 10 },
                7: { cellWidth: 22, halign: 'right' }
            },
            margin: { left: 5, right: 5, bottom: 15 },
            didDrawPage: drawPageDecoration
        });

        // Summary Section
        let lastY = (doc as any).lastAutoTable.finalY + 5;
        const summaryHeight = 35;

        // Check if we need a new page for the summary
        if (lastY + summaryHeight > pageHeight - 15) {
            doc.addPage();
            drawPageDecoration();
            lastY = 20;
        }

        const summaryX = pageWidth - 80;
        const rightEdge = pageWidth - 10;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        const subtotalExclTax = items.reduce((sum, item) => sum + (item.price / 1.18 * item.quantity), 0);

        doc.text("Total Amount Before Tax:", summaryX, lastY);
        doc.text(`Rs. ${subtotalExclTax.toFixed(2)}`, rightEdge, lastY, { align: 'right' });

        const cgst = subtotalExclTax * 0.09;
        const sgst = subtotalExclTax * 0.09;

        doc.setFont("helvetica", "bold");
        doc.text("CGST (9%):", summaryX + 20, lastY + 6);
        doc.text(`Rs. ${cgst.toFixed(2)}`, rightEdge, lastY + 6, { align: 'right' });

        doc.text("SGST (9%):", summaryX + 20, lastY + 12);
        doc.text(`Rs. ${sgst.toFixed(2)}`, rightEdge, lastY + 12, { align: 'right' });

        doc.line(summaryX - 2, lastY + 15, pageWidth - 5, lastY + 15);
        doc.setFontSize(10);
        doc.text("Grand Total:", summaryX, lastY + 22);
        doc.text(`Rs. ${grandTotal.toFixed(2)}`, rightEdge, lastY + 22, { align: 'right' });

        doc.save(`Invoice_${customerName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
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
            // Map items to include actual product names if necessary before sending to API
            const formattedItems = items.map(item => {
                const product = availableProducts.find(p => p._id === item.productName);
                return {
                    ...item,
                    category: product ? product.category : item.category,
                    productName: product ? product.name : item.productName
                };
            });

            const orderData = {
                customerName,
                contact,
                address,
                items: formattedItems,
                subtotal,
                discount,
                grandTotal,
                paidAmount,
                paymentMethod,
                balanceDue,
                companyDetails
            };

            // Save to database
            await api.post("/api/orders", orderData);

            // Trigger PDF generation IMMEDIATELY
            generateInvoicePDF(orderData);

            toast.success("Order placed and invoice generated!");

            // Reset form
            setCustomerName("");
            setContact("");
            setAddress("");
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
                                                                            className="group aria-selected:bg-transparent hover:!bg-blue-600 hover:!text-white data-[selected='true']:bg-transparent cursor-pointer transition-colors"
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    item.productName === p._id ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium text-foreground group-hover:text-white">{p.name}</span>
                                                                                <span className="text-xs text-muted-foreground group-hover:text-blue-50">Price: ₹{p.price} | Category: {p.category}</span>
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

                        {/* Bottom Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                                {companyDetails && (
                                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                        <h4 className="text-sm font-semibold mb-1">Billing From:</h4>
                                        <p className="text-sm font-bold">{companyDetails.companyName}</p>
                                        <p className="text-xs text-muted-foreground">{companyDetails.address}</p>
                                    </div>
                                )}
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
                                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
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
                            Place Order
                        </Button>

                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default CreateOrder;
