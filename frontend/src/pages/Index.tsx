import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { InventoryStatus } from "@/components/dashboard/InventoryStatus";
import { TopProducts } from "@/components/dashboard/TopProducts";
import {
  Package,
  ShoppingCart,
  IndianRupee,
  Users,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import { useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

const Dashboard = () => {
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const { data } = await api.get("/");
        console.log("Backend Connected:", data);
        toast.success("Connected to Backend: " + data);
      } catch (error) {
        console.error("Backend Connection Error:", error);
        toast.error("Failed to connect to Backend");
      }
    };
    checkBackend();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your inventory.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Products"
            value="2,847"
            change="+12.5% from last month"
            changeType="positive"
            icon={Package}
            iconColor="bg-primary/10 text-primary"
          />
          <StatsCard
            title="Total Orders"
            value="1,234"
            change="+8.2% from last month"
            changeType="positive"
            icon={ShoppingCart}
            iconColor="bg-success/10 text-success"
          />
          <StatsCard
            title="Revenue"
            value="₹45,231"
            change="+20.1% from last month"
            changeType="positive"
            icon={IndianRupee}
            iconColor="bg-warning/10 text-warning"
          />
          <StatsCard
            title="Active Customers"
            value="573"
            change="+5.4% from last month"
            changeType="positive"
            icon={Users}
            iconColor="bg-info/10 text-info"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesChart />
          </div>
          <InventoryStatus />
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentOrders />
          <TopProducts />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
