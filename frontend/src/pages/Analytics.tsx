import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Package,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Loader2,
  Download
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";



import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { generateInvoice, generatePaymentStatement } from "@/lib/invoiceGenerator";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Helper to load image
const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve("");
      return;
    }
    const img = new Image();
    img.src = url;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (err) => reject(err);
  });
};


const Analytics = () => {
  const [period, setPeriod] = useState("year");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const revenueChartRef = useRef<HTMLDivElement>(null);
  const categoryChartRef = useRef<HTMLDivElement>(null);
  const orderChartRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/reports/analytics?period=${period}`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const generatePDF = async () => {
    try {
      toast.info("Generating Analytics Report...");

      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Standard Header Layout (similar to Invoice)
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

      // Logo
      try {
        const logoBase64 = await loadImage("/logo.png");
        if (logoBase64) {
          doc.addImage(logoBase64, "PNG", 6, 6, 25, 8);
        }
      } catch (e) {
        console.error("Logo load failed", e);
      }

      // Header Branding
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("BUSINESS ANALYTICS REPORT", pageWidth / 2, 12, { align: "center" });
      doc.line(5, 15, pageWidth - 5, 15);

      // Company Info (Left Side - Name Only)
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("VASANTHA METAL INDUSTRY", 10, 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, 10, 27);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 10, 31);

      const captureChart = async (ref: React.RefObject<HTMLDivElement>) => {
        if (!ref.current) return { url: null, width: 0, height: 0 };
        const html2canvas = (await import("html2canvas")).default;

        const tooltips = ref.current.querySelectorAll('.recharts-tooltip-wrapper');
        tooltips.forEach((t: any) => t.style.display = 'none');

        const canvas = await html2canvas(ref.current, {
          backgroundColor: "#ffffff",
          scale: 3, // Even higher quality
          logging: false,
          useCORS: true,
          windowWidth: ref.current.scrollWidth + 20, // Add padding to avoid clipping
          windowHeight: ref.current.scrollHeight + 20
        });

        tooltips.forEach((t: any) => t.style.display = '');

        return {
          url: canvas.toDataURL("image/png"),
          width: canvas.width,
          height: canvas.height
        };
      };

      // 1. KPI Summary Table
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Performance Overview", 14, 50);

      const kpiData = [
        ["Metric", "Value", "Growth"],
        ["Total Revenue", `Rs. ${(data?.kpis?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, data?.kpis?.totalRevenueChange || "0%"],
        ["Total Orders", data?.kpis?.totalOrders?.toString() || "0", data?.kpis?.totalOrdersChange || "0%"],
        ["Products Sold", data?.kpis?.productsSold?.toLocaleString() || "0", data?.kpis?.productsSoldChange || "0%"],
        ["New Customers", data?.kpis?.newCustomers?.toString() || "0", data?.kpis?.newCustomersChange || "0%"]
      ];

      autoTable(doc, {
        startY: 55,
        head: [kpiData[0]],
        body: kpiData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [45, 62, 80] },
        didDrawPage: (data) => {
          // Re-draw border on subsequent pages
          doc.setDrawColor(0);
          doc.setLineWidth(0.1);
          doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
        }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 15;

      // Add Revenue Chart Image
      const revenueData = await captureChart(revenueChartRef);
      if (revenueData.url) {
        doc.text("Revenue Trend Graph", 14, currentY);
        const imgRatio = revenueData.height / revenueData.width;
        const pdfWidth = 182;
        const pdfHeight = pdfWidth * imgRatio;
        doc.addImage(revenueData.url, 'PNG', 14, currentY + 5, pdfWidth, pdfHeight);
        currentY += pdfHeight + 15;
      }

      // Check if we need a new page
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      // 2. Top Products Table
      doc.text("Top Performing Products", 14, currentY);

      const productData = (data?.topProducts || []).map((p: any, i: number) => [
        i + 1,
        p.name,
        p.sales.toLocaleString(),
        `Rs. ${Number(p.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["#", "Product Name", "Units Sold", "Revenue"]],
        body: productData,
        theme: 'grid',
        headStyles: { fillColor: [45, 62, 80] }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;

      // Add Category & Order Charts on new page if tight
      if (currentY > 150) {
        doc.addPage();
        currentY = 20;
      }

      const categoryDataImg = await captureChart(categoryChartRef);
      if (categoryDataImg.url) {
        doc.text("Sales Distribution", 14, currentY);
        const imgRatio = categoryDataImg.height / categoryDataImg.width;
        const pdfWidth = 85;
        const pdfHeight = pdfWidth * imgRatio;
        doc.addImage(categoryDataImg.url, 'PNG', 14, currentY + 5, pdfWidth, pdfHeight);
      }

      const orderDataImg = await captureChart(orderChartRef);
      if (orderDataImg.url) {
        doc.text("Order Volume Trend", 110, currentY);
        const imgRatio = orderDataImg.height / orderDataImg.width;
        const pdfWidth = 85;
        const pdfHeight = pdfWidth * imgRatio;
        doc.addImage(orderDataImg.url, 'PNG', 110, currentY + 5, pdfWidth, pdfHeight);
      }

      currentY += 95;

      // 3. Category Sales Table (Final summary)
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.text("Category Breakdown", 14, currentY);

      const categoryRows = (data?.categorySales || []).map((c: any) => [
        c.name || 'Uncategorized',
        `Rs. ${Number(c.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [["Category", "Total Revenue"]],
        body: categoryRows,
        theme: 'striped',
        headStyles: { fillColor: [45, 62, 80] }
      });

      doc.save(`Analytics_Report_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Revenue",
      value: `₹${(data?.kpis?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: data?.kpis?.totalRevenueChange || "+0%",
      trend: data?.kpis?.totalRevenueTrend || "up",
      icon: IndianRupee,
    },
    {
      title: "Total Orders",
      value: data?.kpis?.totalOrders.toString() || '0',
      change: data?.kpis?.totalOrdersChange || "+0%",
      trend: data?.kpis?.totalOrdersTrend || "up",
      icon: ShoppingCart,
    },
    {
      title: "Products Sold",
      value: data?.kpis?.productsSold.toLocaleString() || '0',
      change: data?.kpis?.productsSoldChange || "+0%",
      trend: data?.kpis?.productsSoldTrend || "up",
      icon: Package,
    },
    {
      title: "New Customers",
      value: data?.kpis?.newCustomers.toString() || '0',
      change: data?.kpis?.newCustomersChange || "+0%",
      trend: data?.kpis?.newCustomersTrend || "up",
      icon: Users,
    },
  ];

  const categoryColors = [
    "hsl(var(--primary))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--destructive))",
    "hsl(var(--muted-foreground))",
    "hsl(var(--accent))",
    "hsl(var(--secondary))",
  ];

  const categoryData = (data?.categorySales || []).map((c: any, i: number) => ({
    ...c,
    value: Number(c.value.toFixed(2)),
    color: categoryColors[i % categoryColors.length]
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Track performance metrics and business insights
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="default"
            onClick={generatePDF}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-sm transition-colors group"
          >
            <Download className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {
          kpiCards.map((kpi) => (
            <Card key={kpi.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="rounded-full bg-blue-50 p-2">
                    <kpi.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      kpi.trend === "up"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }
                  >
                    {kpi.trend === "up" ? (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="mr-1 h-3 w-3" />
                    )}
                    {kpi.change}
                  </Badge>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-slate-900 font-bold">Revenue Trend</CardTitle>
            <CardDescription>Sales growth performance over time</CardDescription>
          </CardHeader>
          <CardContent ref={revenueChartRef}>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="label" className="text-xs" axisLine={false} tickLine={false} />
                  <YAxis className="text-xs" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(val: any) => `₹${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900 font-bold">Sales by Category</CardTitle>
            <CardDescription>Product category distribution</CardDescription>
          </CardHeader>
          <CardContent ref={categoryChartRef}>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `₹${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {categoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No sales data recorded</p>
              ) : (
                categoryData.map((category: any) => (
                  <div key={category.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="truncate max-w-[150px]">{category.name}</span>
                    </div>
                    <span className="font-medium">₹{Number(category.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900 font-bold">Order Trends</CardTitle>
            <CardDescription>Monthly order volume fluctuation</CardDescription>
          </CardHeader>
          <CardContent ref={orderChartRef}>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="label" className="text-xs" axisLine={false} tickLine={false} />
                  <YAxis className="text-xs" axisLine={false} tickLine={false} tickFormatter={(val) => val.toLocaleString()} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="orders"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="Orders"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900 font-bold">Top Performing Products</CardTitle>
            <CardDescription>Best selling products this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.topProducts || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No product sales data available</p>
              ) : (
                data.topProducts.map((product: any, index: number) => (
                  <div key={product.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm font-bold group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.sales.toLocaleString()} units sold | ₹{Number(product.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-primary/20 text-primary"
                    >
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      Top Seller
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
