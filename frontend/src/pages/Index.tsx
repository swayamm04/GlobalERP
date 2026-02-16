"use client";
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
  Activity,
  AlertTriangle,
} from "lucide-react";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalActiveOrders: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token"); // Assuming auth token is stored
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
        const { data } = await api.get("/api/dashboard", config);
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your inventory.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatsCard
          title="Total Products"
          value={(stats?.totalProducts ?? 0).toString()}
          icon={Package}
          iconColor="bg-primary/10 text-primary"
        />
        <StatsCard
          title="Total Orders"
          value={(stats?.totalOrders ?? 0).toString()}
          icon={ShoppingCart}
          iconColor="bg-success/10 text-success"
        />
        <StatsCard
          title="Revenue"
          value={`₹${(stats?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={IndianRupee}
          iconColor="bg-warning/10 text-warning"
        />
        <StatsCard
          title="Active Orders"
          value={(stats?.totalActiveOrders ?? 0).toString()}
          icon={Activity}
          iconColor="bg-blue-500/10 text-blue-500"
        />
        <StatsCard
          title="Active Customers"
          value={(stats?.activeCustomers ?? 0).toString()}
          icon={Users}
          iconColor="bg-info/10 text-info"
        />
      </div>

      {/* Charts Row Removed */}

      {/* Bottom Row */}
      <div className="grid gap-6">
        <RecentOrders orders={stats.recentOrders} />
      </div>
    </div>
  );
};

export default Dashboard;
