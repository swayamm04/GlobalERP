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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  /* Report Generation State */
  const [generatingReport, setGeneratingReport] = React.useState<string | null>(null);
  const [dateRange, setDateRange] = React.useState({ start: "", end: "" });

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

  const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) {
      toast.info("No data available for this report");
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row =>
        headers.map(fieldName => {
          const value = row[fieldName];
          const stringValue = value === null || value === undefined ? "" : String(value);
          // Escape quotes by doubling them and wrap in quotes if needed
          if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const generatePDF = async (data: any[], title: string, filename: string) => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Add Logo
      try {
        const logoImg = new Image();
        logoImg.src = "/logo.png";
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });

        // Add logo to PDF (x, y, width, height)
        doc.addImage(logoImg, "PNG", 14, 10, 30, 15);
      } catch (e) {
        console.warn("Could not load logo for PDF", e);
      }

      // Add Company Name and Header Info
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text("Vasantha Metal Industry", 50, 18);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Generated on: " + format(new Date(), "PPpp"), 50, 24);

      // Report Title
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(title, 14, 40);

      if (!data.length) {
        doc.text("No data available.", 14, 50);
        doc.save(`${filename}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
        return;
      }

      // Prepare Table Data
      const headers = Object.keys(data[0]);
      const tableData = data.map(row => Object.values(row).map(String));

      // Generate Table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [40, 40, 40] }
      });

      doc.save(`${filename}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadReport = async (reportName: string, endpoint: string, formatType: 'csv' | 'pdf') => {
    try {
      setGeneratingReport(`${reportName}-${formatType}`);
      toast.info(`Generating ${reportName} (${formatType.toUpperCase()})...`);

      let url = endpoint;
      if (dateRange.start || dateRange.end) {
        const params = new URLSearchParams();
        if (dateRange.start) params.append('startDate', dateRange.start);
        if (dateRange.end) params.append('endDate', dateRange.end);
        url += `?${params.toString()}`;
      }

      const { data } = await api.get(url);

      const filename = reportName.replace(/\s+/g, '_').toLowerCase();

      if (formatType === 'csv') {
        downloadCSV(data, filename);
      } else {
        await generatePDF(data, reportName, filename);
      }

      toast.success(`${reportName} downloaded successfully`);
    } catch (error) {
      console.error(`Error generating ${reportName}:`, error);
      toast.error(`Failed to generate ${reportName}`);
    } finally {
      setGeneratingReport(null);
    }
  };

  const reportCategories = [
    {
      title: "Sales Reports",
      icon: IndianRupee,
      description: "Revenue, transactions, and sales performance",
      reports: [
        { name: "Monthly Sales Summary", endpoint: "/api/reports/sales/summary" },
        { name: "Sales by Product Category", endpoint: "/api/reports/sales/category" },
      ],
    },
    {
      title: "Inventory Reports",
      icon: Package,
      description: "Stock levels, movements, and valuations",
      reports: [
        { name: "Product Stock Levels", endpoint: "/api/reports/inventory/products" },
        { name: "Raw Material Stock", endpoint: "/api/reports/inventory/raw-materials" },
      ],
    },
    {
      title: "Order Reports",
      icon: FileText,
      description: "Order status, fulfillment, and trends",
      reports: [
        { name: "Order History", endpoint: "/api/reports/orders/history" },
        { name: "Pending Orders", endpoint: "/api/reports/orders/pending" },
      ],
    },
    {
      title: "Supplier & Customer",
      icon: Users,
      description: "Performance and insights",
      reports: [
        { name: "Supplier Performance", endpoint: "/api/reports/suppliers/performance" },
        { name: "Top Customers", endpoint: "/api/reports/customers/top" },
      ],
    },
    {
      title: "Admin Reports",
      icon: Users,
      description: "System activity and logs",
      reports: [
        { name: "User Activity Log", endpoint: "/api/reports/activity-log" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            Generate and download business reports
          </p>
        </div>

        <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap px-2">
            Filter Date:
          </span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="date"
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="relative">
              <input
                type="date"
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={dateRange.end}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
            {(dateRange.start || dateRange.end) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateRange({ start: "", end: "" })}
                className="ml-2 h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Reports Section can be simplified or removed if redundant, 
            keeping it consistent with categories for now */}

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
                    </div>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            disabled={generatingReport?.startsWith(report.name)}
                          >
                            {generatingReport?.startsWith(report.name) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadReport(report.name, report.endpoint, 'csv')}>
                            Export to Excel (CSV)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadReport(report.name, report.endpoint, 'pdf')}>
                            Export to PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cancel History Quick Access */}
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-colors border-destructive/20 mt-6"
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
    </div>
  );
};

export default Reports;
