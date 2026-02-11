import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Loader2, Filter, CheckCircle2, RefreshCcw, MoreVertical, CreditCard, History, Plus, XCircle } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PaymentHistory {
    amount: number;
    date: string;
    method: string;
}

interface Order {
    id: string;
    customer: string;
    date: string;
    items: number;
    amount: number;
    status: string;
    customerType: string;
    balanceDue: number;
    paidAmount: number;
    paymentHistory?: PaymentHistory[];
}

const getStatusVariant = (status: string) => {
    switch (status) {
        case "Completed":
            return "default";
        case "Processing":
            return "secondary";
        case "Shipped":
            return "outline";
        case "Pending":
            return "secondary";
        case "Cancelled":
            return "destructive";
        default:
            return "secondary";
    }
};

const PendingOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    console.log("PendingOrders Rendering - Actions: 3-dots, Unpaid: Dropdown");
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    // Payment Modal State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [newPaymentAmount, setNewPaymentAmount] = useState("");
    const [newPaymentMethod, setNewPaymentMethod] = useState("Cash");
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    // Cancel Order State
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesSearch =
                order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.id.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType =
                typeFilter === "all" ||
                order.customerType.toLowerCase() === typeFilter.toLowerCase();

            const isNotDone = order.status !== "Completed" || order.balanceDue > 0;

            return matchesSearch && matchesType && isNotDone;
        });
    }, [orders, searchTerm, typeFilter]);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get("/api/orders");
            setOrders(data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setUpdatingId(`${orderId}-${newStatus}`);
        try {
            await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order marked as ${newStatus}`);
            fetchOrders();
        } catch (error) {
            console.error("Error updating order:", error);
            toast.error("Failed to update order");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCancelOrder = async () => {
        if (!orderToCancel) return;

        setIsSubmittingCancel(true);
        try {
            await api.patch(`/api/orders/${orderToCancel}/status`, { status: "Cancelled" });
            toast.success("Order cancelled successfully");
            setIsCancelDialogOpen(false);
            setOrderToCancel(null);
            fetchOrders();
        } catch (error) {
            console.error("Error cancelling order:", error);
            toast.error("Failed to cancel order");
        } finally {
            setIsSubmittingCancel(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);


    const handleAddPayment = async () => {
        if (!selectedOrder || !newPaymentAmount || parseFloat(newPaymentAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        const amount = parseFloat(newPaymentAmount);
        if (amount > selectedOrder.balanceDue) {
            toast.error("Payment amount cannot exceed balance due");
            return;
        }

        setIsSubmittingPayment(true);
        try {
            await api.patch(`/api/orders/${selectedOrder.id}/payment`, {
                amount,
                method: newPaymentMethod
            });
            toast.success("Payment added successfully");
            setIsPaymentModalOpen(false);
            setNewPaymentAmount("");
            fetchOrders();
        } catch (error) {
            console.error("Error adding payment:", error);
            toast.error("Failed to add payment");
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    const openPaymentModal = (order: Order) => {
        setSelectedOrder(order);
        setNewPaymentAmount("");
        setIsPaymentModalOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Pending Orders List</h1>
                        <p className="text-muted-foreground">Manage active and undelivered orders (Actions Updated)</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="relative flex-1 max-w-sm w-full">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search orders..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <div className="flex items-center gap-2">
                                            <Filter className="h-4 w-4" />
                                            <SelectValue placeholder="Filter" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="individual">Individual</SelectItem>
                                        <SelectItem value="business">Business</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="hidden sm:table-cell">Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Due</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">Loading orders...</TableCell>
                                    </TableRow>
                                ) : filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">No pending orders found</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow
                                            key={order.id}
                                            className="hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell className="font-medium hidden sm:table-cell">
                                                #{order.id ? order.id.substring(Math.max(0, order.id.length - 6)).toUpperCase() : "N/A"}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{order.customer}</TableCell>
                                            <TableCell className="hidden md:table-cell whitespace-nowrap">
                                                {format(new Date(order.date), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">₹{(order.amount || 0).toLocaleString()}</TableCell>
                                            <TableCell className={cn("whitespace-nowrap font-semibold", order.balanceDue > 0 ? "text-destructive" : "text-foreground")}>
                                                {order.balanceDue > 0 ? `₹${order.balanceDue.toLocaleString()}` : "-"}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={getStatusVariant(order.status)}>
                                                        {order.status}
                                                    </Badge>
                                                    {order.balanceDue > 0 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-destructive text-destructive"
                                                        >
                                                            Unpaid
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {order.balanceDue > 0 && (
                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-blue-600 focus:text-blue-600"
                                                                onClick={() => openPaymentModal(order)}
                                                            >
                                                                <CreditCard className="mr-2 h-4 w-4" />
                                                                <span>Add Payment</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {order.status !== 'Completed' && (
                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-green-600 focus:text-green-600"
                                                                onClick={() => handleUpdateStatus(order.id, 'Completed')}
                                                            >
                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                <span>Mark as Delivered</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-destructive focus:text-destructive"
                                                            onClick={() => {
                                                                setOrderToCancel(order.id);
                                                                setIsCancelDialogOpen(true);
                                                            }}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            <span>Cancel Order</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Payment Modal */}
                <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Order Payment Details</DialogTitle>
                        </DialogHeader>

                        {selectedOrder && (
                            <div className="space-y-6">
                                {/* Amount Summary */}
                                <div className="space-y-4">
                                    <div className="border rounded-lg p-6 bg-primary/5 text-center">
                                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Grand Total</p>
                                        <p className="text-3xl font-bold text-primary">₹{selectedOrder.amount.toLocaleString()}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="border rounded-lg p-4 bg-green-50/50 text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Total Paid</p>
                                            <p className="text-xl font-bold text-green-600">₹{(selectedOrder.paidAmount || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="border rounded-lg p-4 bg-red-50/50 text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Balance Due</p>
                                            <p className="text-xl font-bold text-destructive">₹{selectedOrder.balanceDue.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Add Payment Section */}
                                <div className="space-y-4 border rounded-lg p-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Plus className="h-4 w-4" /> Add New Payment
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="pay-method">Method</Label>
                                            <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                                                <SelectTrigger id="pay-method">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Cash">Cash</SelectItem>
                                                    <SelectItem value="Online">Online</SelectItem>
                                                    <SelectItem value="Card">Card</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="pay-amount">Amount</Label>
                                            <Input
                                                id="pay-amount"
                                                type="number"
                                                placeholder="Enter amount"
                                                value={newPaymentAmount}
                                                onChange={(e) => setNewPaymentAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full"
                                        disabled={isSubmittingPayment}
                                        onClick={handleAddPayment}
                                    >
                                        {isSubmittingPayment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                                        Record Payment
                                    </Button>
                                </div>

                                {/* Payment History */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <History className="h-4 w-4" /> Payment History
                                    </h3>
                                    <div className="max-h-[200px] overflow-y-auto border rounded-md">
                                        <Table>
                                            <TableHeader className="bg-muted/50 sticky top-0">
                                                <TableRow>
                                                    <TableHead className="py-2">Date</TableHead>
                                                    <TableHead className="py-2">Method</TableHead>
                                                    <TableHead className="py-2 text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {!selectedOrder.paymentHistory || selectedOrder.paymentHistory.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No history found</TableCell>
                                                    </TableRow>
                                                ) : (
                                                    selectedOrder.paymentHistory.map((history, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell className="py-2">{format(new Date(history.date), 'MMM dd, yyyy')}</TableCell>
                                                            <TableCell className="py-2">{history.method}</TableCell>
                                                            <TableCell className="py-2 text-right font-medium">₹{history.amount.toLocaleString()}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {/* Cancel Confirmation Dialog */}
                <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will cancel the order. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmittingCancel}>No, keep order</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleCancelOrder();
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={isSubmittingCancel}
                            >
                                {isSubmittingCancel ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    "Yes, cancel order"
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </DashboardLayout>
    );
};

export default PendingOrders;
