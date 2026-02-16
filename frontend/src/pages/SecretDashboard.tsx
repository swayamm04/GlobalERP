"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, ClipboardList, Lock, IndianRupee, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import Orders from "./Orders";
import PendingOrders from "./PendingOrders";
import { StatsCard } from "@/components/dashboard/StatsCard";
import api from "@/lib/api";
import { toast } from "sonner";

const SecretDashboard = () => {
    const [activeTab, setActiveTab] = useState("pending");
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalActiveOrders: 0,
        totalRevenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSecretStats = async () => {
            try {
                const { data } = await api.get("/api/dashboard?secret=true");
                setStats(data);
            } catch (error) {
                console.error("Error fetching secret stats:", error);
                toast.error("Failed to load secret stats");
            } finally {
                setLoading(false);
            }
        };
        fetchSecretStats();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Lock className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Secret Management</h1>
                    <p className="text-muted-foreground">Manage orders placed without GST</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[900px]">
                <StatsCard
                    title="Total Orders"
                    value={loading ? "..." : (stats?.totalOrders ?? 0).toString()}
                    icon={ShoppingCart}
                    iconColor="bg-success/10 text-success"
                />
                <StatsCard
                    title="Revenue"
                    value={loading ? "..." : `₹${(stats?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon={IndianRupee}
                    iconColor="bg-warning/10 text-warning"
                />
                <StatsCard
                    title="Active Orders"
                    value={loading ? "..." : (stats?.totalActiveOrders ?? 0).toString()}
                    icon={Activity}
                    iconColor="bg-blue-500/10 text-blue-500"
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="pending" className="gap-2">
                        <ClipboardList className="h-4 w-4" />
                        <span>Pending Orders</span>
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Completed Orders</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6 border-none p-0">
                    <PendingOrders isSecret={true} isStandalone={true} />
                </TabsContent>

                <TabsContent value="completed" className="mt-6 border-none p-0">
                    <Orders isSecret={true} isStandalone={true} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SecretDashboard;
