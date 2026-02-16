import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Package, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

const Inventory = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    inStockCount: 0,
    outOfStockCount: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [outOfStockItems, setOutOfStockItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        const { data } = await api.get("/api/products");

        // Calculate stats
        let totalItems = data.length;
        let lowStockCount = 0;
        let inStockCount = 0;
        let outOfStockCount = 0;
        let lowStockList: any[] = [];
        let outOfStockList: any[] = [];

        data.forEach((product: any) => {
          // totalItems is now just the product count, already set above

          if (product.status === "Low Stock") {
            lowStockCount++;
            lowStockList.push(product);
          } else if (product.status === "Out of Stock") {
            outOfStockCount++;
            outOfStockList.push(product);
          } else {
            inStockCount++;
          }
        });

        setStats({
          totalItems,
          lowStockCount,
          inStockCount,
          outOfStockCount,
        });
        setLowStockItems(lowStockList);
        setOutOfStockItems(outOfStockList);
      } catch (error) {
        console.error("Error fetching inventory data:", error);
        toast.error("Failed to load inventory data");
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory</h1>
        <p className="text-muted-foreground">Monitor and manage your stock levels</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Products"
          value={stats.totalItems.toLocaleString()}
          icon={Package}
          iconColor="bg-primary/10 text-primary"
        />
        <StatsCard
          title="In Stock"
          value={stats.inStockCount.toString()}
          icon={CheckCircle}
          iconColor="bg-success/10 text-success"
        />
        <StatsCard
          title="Low Stock Items"
          value={stats.lowStockCount.toString()}
          icon={AlertTriangle}
          iconColor="bg-warning/10 text-warning"
        />
        <StatsCard
          title="Out of Stock"
          value={stats.outOfStockCount.toString()}
          icon={TrendingDown}
          iconColor="bg-destructive/10 text-destructive"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No low stock items</p>
              ) : (
                lowStockItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between rounded-lg border p-3 bg-warning/5 border-warning/20"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Category: {item.category?.name || "No Category"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-warning">
                        {item.stock} {item.unit || 'pcs'}
                      </p>
                      <p className="text-xs text-muted-foreground">remaining</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Out of Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {outOfStockItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No out of stock items</p>
              ) : (
                outOfStockItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between rounded-lg border p-3 bg-destructive/5 border-destructive/20"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Category: {item.category?.name || "No Category"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-destructive">
                        {item.stock} {item.unit || 'pcs'}
                      </p>
                      <p className="text-xs text-muted-foreground">remaining</p>
                    </div>
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

export default Inventory;
