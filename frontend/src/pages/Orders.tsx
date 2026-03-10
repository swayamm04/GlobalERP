"use client";
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
import { Search, Download, Loader2, FilterX, Filter } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { generateInvoice } from "@/lib/invoiceGenerator";

interface Order {
  id: string;
  customer: string;
  date: string;
  items: any[];
  product: string;
  amount: number;
  status: string;
  customerType: string;
  balanceDue?: number;
  paidAmount?: number;
  includeGST?: boolean;
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

const Orders = ({ isSecret = false, isStandalone = false }: { isSecret?: boolean, isStandalone?: boolean }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const sanitizedSearch = searchTerm.replace(/^#/, "").toLowerCase().trim();
      const orderId = order.id ? order.id.toLowerCase() : "";

      const matchesSearch =
        order.customer.toLowerCase().includes(sanitizedSearch) ||
        orderId.includes(sanitizedSearch) ||
        (order.product && order.product.toLowerCase().includes(sanitizedSearch));

      const matchesType =
        typeFilter === "all" ||
        order.customerType.toLowerCase() === typeFilter.toLowerCase();

      const isDone = order.status === "Completed" && (order.balanceDue === 0 || !order.balanceDue);

      // Filter by GST status (secret/non-secret)
      const matchesSecret = isSecret ? order.includeGST === false : (order.includeGST === true || order.includeGST === undefined);

      return matchesSearch && matchesType && isDone && matchesSecret;
    });
  }, [orders, searchTerm, typeFilter, isSecret]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get(`/api/orders${isSecret ? "?secret=true" : ""}`);
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingId(orderId);
    try {
      const { data: order } = await api.get(`/api/orders/${orderId}`);
      const { data: settings } = await api.get("/api/company-settings");

      await generateInvoice({
        customerName: order.customerName,
        contact: order.contact,
        address: order.address,
        items: order.items,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        orderId: order._id,
        date: order.createdAt,
        companyDetails: settings,
        includeGST: order.includeGST,
        paidAmount: order.paidAmount,
        balanceDue: order.balanceDue,
        loadingCharge: order.loadingCharge,
        roundOff: order.roundOff
      });

      toast.success("Invoice downloaded!");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  const Content = (
    <div className={`space-y-6 ${isStandalone ? "pt-4" : ""}`}>
      {!isStandalone && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{isSecret ? "Secret Delivered Orders" : "Delivered Orders"}</h1>
            <p className="text-muted-foreground">
              {isSecret ? "View completed orders created without tax" : "View all delivered and completed orders"}
            </p>
          </div>
        </div>
      )}

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
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
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
                  <TableCell colSpan={7} className="text-center h-24">No orders found</TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium hidden sm:table-cell">
                      #{order.id ? order.id.substring(Math.max(0, order.id.length - 6)).toUpperCase() : "N/A"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{order.customer}</TableCell>
                    <TableCell className="hidden md:table-cell whitespace-nowrap">
                      {format(new Date(order.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{order.items?.length || 0} Items</TableCell>
                    <TableCell className="whitespace-nowrap">₹{(order.amount || 0).toLocaleString()}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadInvoice(order.id)}
                        disabled={downloadingId === order.id}
                      >
                        {downloadingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  if (isStandalone) return Content;

  return Content;
};

export default Orders;
