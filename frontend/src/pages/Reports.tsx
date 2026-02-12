import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  IndianRupee,
  Users,
  Truck,
  BarChart3,
  PieChart,
  History,
  Loader2,
  Table as TableIcon
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const reportCategories = [
  {
    title: "Sales Reports",
    icon: IndianRupee,
    description: "Revenue, transactions, and sales performance",
    reports: [
      { name: "Monthly Sales Summary", lastGenerated: "2024-01-28" },
      { name: "Sales by Product Category", lastGenerated: "2024-01-27" },
      { name: "Sales by Region", lastGenerated: "2024-01-25" },
    ],
  },
  {
    title: "Inventory Reports",
    icon: Package,
    description: "Stock levels, movements, and valuations",
    reports: [
      { name: "Current Stock Levels", lastGenerated: "2024-01-28" },
      { name: "Low Stock Alert", lastGenerated: "2024-01-28" },
      { name: "Inventory Valuation", lastGenerated: "2024-01-20" },
    ],
  },
  {
    title: "Order Reports",
    icon: FileText,
    description: "Order status, fulfillment, and trends",
    reports: [
      { name: "Order Fulfillment Rate", lastGenerated: "2024-01-28" },
      { name: "Pending Orders Summary", lastGenerated: "2024-01-28" },
      { name: "Order History", lastGenerated: "2024-01-26" },
    ],
  },
  {
    title: "Supplier Reports",
    icon: Truck,
    description: "Supplier performance and procurement",
    reports: [
      { name: "Supplier Performance", lastGenerated: "2024-01-22" },
      { name: "Purchase Order Summary", lastGenerated: "2024-01-28" },
      { name: "Supplier Payment History", lastGenerated: "2024-01-15" },
    ],
  },
  {
    title: "Customer Reports",
    icon: Users,
    description: "Customer insights and behavior",
    reports: [
      { name: "Customer Acquisition", lastGenerated: "2024-01-28" },
      { name: "Top Customers", lastGenerated: "2024-01-25" },
      { name: "Customer Retention", lastGenerated: "2024-01-20" },
    ],
  },
  {
    title: "Financial Reports",
    icon: TrendingUp,
    description: "Profit, loss, and financial metrics",
    reports: [
      { name: "Profit & Loss Statement", lastGenerated: "2024-01-28" },
      { name: "Cost Analysis", lastGenerated: "2024-01-25" },
      { name: "Revenue Forecast", lastGenerated: "2024-01-22" },
    ],
  },
];

const quickReports = [
  { name: "Daily Sales", type: "Auto-generated", status: "Ready" },
  { name: "Weekly Inventory", type: "Auto-generated", status: "Ready" },
  { name: "Monthly Summary", type: "Scheduled", status: "Generating" },
  { name: "Quarterly Review", type: "Manual", status: "Ready" },
];

const Reports = () => {
  /* Cancel History State */
  const [showCancelHistory, setShowCancelHistory] = React.useState(false);
  const [cancelledOrders, setCancelledOrders] = React.useState<any[]>([]);
  const [loadingCancelled, setLoadingCancelled] = React.useState(false);

  const fetchCancelledOrders = async () => {
    setLoadingCancelled(true);
    try {
      const { data } = await api.get("/api/orders");
      // Filter for cancelled orders containing both secret and non-secret
      const cancelled = data.filter((o: any) => o.status === "Cancelled");
      setCancelledOrders(cancelled);
    } catch (error) {
      console.error("Failed to fetch cancelled orders", error);
      toast.error("Failed to load cancel history");
    } finally {
      setLoadingCancelled(false);
    }
  };
  React.useEffect(() => {
    if (showCancelHistory) {
      fetchCancelledOrders();
    }
  }, [showCancelHistory]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">
              Generate and download business reports
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Report
            </Button>
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              Custom Report
            </Button>
          </div>
        </div>

        {/* Quick Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Reports
            </CardTitle>
            <CardDescription>Frequently accessed reports ready to download</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {quickReports.map((report) => (
                <div
                  key={report.name}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium text-sm sm:text-base">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.type}</p>
                  </div>
                  {report.status === "Ready" ? (
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Download className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="whitespace-nowrap text-[10px]">Generating...</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cancel History Quick Access */}
        <Card
          className="cursor-pointer hover:bg-muted/50 transition-colors border-destructive/20"
          onClick={() => setShowCancelHistory(true)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-destructive/10 p-2">
                <History className="h-5 w-5 text-destructive" />
              </div>
              <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                View History
              </Badge>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold">Cancel History</div>
              <p className="text-sm text-muted-foreground">View a complete log of all cancelled orders</p>
            </div>
          </CardContent>
        </Card>

        {/* Report Categories */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {reportCategories.map((category) => (
            <Card key={category.title}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <category.icon className="h-5 w-5 text-primary" />
                  {category.title}
                </CardTitle>
                <CardDescription className="text-xs">{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.reports.map((report) => (
                    <div
                      key={report.name}
                      className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{report.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Last: {report.lastGenerated}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Report Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <PieChart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">156</div>
                  <p className="text-xs text-muted-foreground">Reports Generated</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-success/10 p-3">
                  <Download className="h-6 w-6 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">89</div>
                  <p className="text-xs text-muted-foreground">Downloads This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-warning/10 p-3">
                  <Calendar className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">Scheduled Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-secondary p-3">
                  <FileText className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">Custom Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel History Modal */}
      {/* Cancel History Modal */}
      <Dialog open={showCancelHistory} onOpenChange={setShowCancelHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cancelled Orders History</DialogTitle>
            <DialogDescription>
              A complete list of all orders that have been cancelled.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {loadingCancelled ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : cancelledOrders.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No cancelled orders found.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cancelledOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">{order.orderId || order._id?.substring(0, 8)}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>
                          {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell>₹{order.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Cancelled</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Reports;
