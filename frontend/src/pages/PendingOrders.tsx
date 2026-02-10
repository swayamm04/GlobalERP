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
import { Search, Loader2, Filter, CheckCircle2, RefreshCcw, MoreVertical, CreditCard } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Order {
    id: string;
    customer: string;
    date: string;
    items: number;
    amount: number;
    status: string;
    customerType: string;
    balanceDue: number;
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

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setUpdatingId(`${orderId}-${newStatus}`);
        try {
            await api.patch(`/api/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order marked as ${newStatus}`);
            fetchOrders(); // Refresh list
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleMarkAsPaid = async (orderId: string) => {
        setUpdatingId(`${orderId}-Paid`);
        try {
            await api.patch(`/api/orders/${orderId}/pay`);
            toast.success("Order marked as fully paid");
            fetchOrders();
        } catch (error) {
            console.error("Error marking as paid:", error);
            toast.error("Failed to update payment");
        } finally {
            setUpdatingId(null);
        }
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
                                                                onClick={() => handleMarkAsPaid(order.id)}
                                                            >
                                                                <CreditCard className="mr-2 h-4 w-4" />
                                                                <span>Mark as Paid</span>
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
            </div>
        </DashboardLayout>
    );
};

export default PendingOrders;
