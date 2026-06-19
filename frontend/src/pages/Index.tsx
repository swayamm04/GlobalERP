"use client";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import {
  Package,
  ShoppingCart,
  IndianRupee,
  Users,
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  Plus,
  Search,
  Shield,
  Loader2,
  AlertCircle
} from "lucide-react";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import Cookies from "js-cookie";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const Dashboard = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Standard Admin Dashboard State
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalActiveOrders: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    recentOrders: [],
  });

  // Super Admin SaaS Dashboard State
  const [superStats, setSuperStats] = useState({
    totalCompanies: 0,
    totalRevenue: 0,
    recentlyJoined: [],
    warnings: [],
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [searchCompany, setSearchCompany] = useState("");
  
  // Modals / Dialogs State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    industry: "Steel",
    subscriptionDuration: "1 month",
    amountPaid: "0",
    subscriptionStartDate: new Date().toISOString().substring(0, 10),
  });

  useEffect(() => {
    setUserRole(Cookies.get("user_role") || null);
    setMounted(true);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const role = Cookies.get("user_role");
      if (role === "super_admin") {
        // Fetch Super Admin Stats
        const statsRes = await api.get("/api/dashboard");
        setSuperStats(statsRes.data);

        // Fetch All Companies
        const companiesRes = await api.get("/api/users");
        // Exclude the super admin from the list of companies
        const filtered = companiesRes.data.filter((u: any) => u.role !== "super_admin");
        setCompanies(filtered);
      } else {
        // Fetch Regular Tenant Stats
        const { data } = await api.get("/api/dashboard");
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchDashboardData();
    }
  }, [mounted]);

  // Company management handlers
  const handleOpenAdd = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      industry: "Steel",
      subscriptionDuration: "1 month",
      amountPaid: "0",
      subscriptionStartDate: new Date().toISOString().substring(0, 10),
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (company: any) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      email: company.email,
      password: "", // Leave blank if not updating password
      industry: company.industry || "Steel",
      subscriptionDuration: company.subscriptionDuration || "1 month",
      amountPaid: (company.amountPaid || 0).toString(),
      subscriptionStartDate: company.subscriptionStartDate
        ? new Date(company.subscriptionStartDate).toISOString().substring(0, 10)
        : new Date().toISOString().substring(0, 10),
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (company: any) => {
    setSelectedCompany(company);
    setIsDeleteOpen(true);
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/api/users", formData);
      toast.success("Company registered successfully");
      setIsAddOpen(false);
      fetchDashboardData();
    } catch (error: any) {
      console.error("Error adding company:", error);
      toast.error(error.response?.data?.message || "Failed to register company");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updatePayload: any = { ...formData };
      if (!updatePayload.password) {
        delete updatePayload.password;
      }
      await api.put(`/api/users/${selectedCompany._id}`, updatePayload);
      toast.success("Company settings updated successfully");
      setIsEditOpen(false);
      fetchDashboardData();
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(error.response?.data?.message || "Failed to update company");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompany = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/api/users/${selectedCompany._id}`);
      toast.success("Company deleted successfully");
      setIsDeleteOpen(false);
      fetchDashboardData();
    } catch (error: any) {
      console.error("Error deleting company:", error);
      toast.error(error.response?.data?.message || "Failed to delete company");
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysRemaining = (endDateStr: string) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 font-medium">Loading system...</span>
      </div>
    );
  }

  // --- Super Admin SaaS Dashboard UI ---
  if (userRole === "super_admin") {
    const activeWarnings = superStats.warnings || [];
    const recentJoinedList = superStats.recentlyJoined || [];

    const filteredCompanies = companies.filter((c) =>
      c.name.toLowerCase().includes(searchCompany.toLowerCase()) ||
      c.email.toLowerCase().includes(searchCompany.toLowerCase()) ||
      (c.industry || "").toLowerCase().includes(searchCompany.toLowerCase())
    );

    return (
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" /> Super Admin Control Center
            </h1>
            <p className="text-muted-foreground">
              Global dashboard for Nirvana ERP tenants, SaaS revenue, and subscriptions.
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
            <Plus className="mr-2 h-4 w-4" /> Add Company
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Companies"
            value={superStats.totalCompanies.toString()}
            icon={Building2}
            iconColor="bg-blue-500/10 text-blue-500"
          />
          <StatsCard
            title="Total SaaS Revenue"
            value={`₹${(superStats.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={IndianRupee}
            iconColor="bg-emerald-500/10 text-emerald-500"
          />
          <StatsCard
            title="SaaS Warnings"
            value={activeWarnings.length.toString()}
            icon={AlertTriangle}
            iconColor="bg-amber-500/10 text-amber-500"
          />
          <StatsCard
            title="Active Subscriptions"
            value={companies.filter(c => getDaysRemaining(c.subscriptionEndDate) > 0).length.toString()}
            icon={Activity}
            iconColor="bg-purple-500/10 text-purple-500"
          />
        </div>

        {/* Expiry Warning Callout Banner */}
        {activeWarnings.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center gap-3">
              <div className="p-2 bg-amber-500/15 rounded-full text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-amber-800 dark:text-amber-300 font-bold">Subscription Action Required</CardTitle>
                <CardDescription className="text-amber-700/80 dark:text-amber-400/80">
                  {activeWarnings.length} tenants have subscriptions ending soon or already expired.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2">
              {activeWarnings.map((company: any) => {
                const daysLeft = getDaysRemaining(company.subscriptionEndDate);
                return (
                  <div
                    key={company._id}
                    className="flex justify-between items-center bg-background border border-amber-200/50 dark:border-amber-900/30 rounded-md p-3 text-sm shadow-sm"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{company.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({company.email})</span>
                    </div>
                    <div>
                      {daysLeft <= 0 ? (
                        <span className="font-bold text-red-600 dark:text-red-400">Expired</span>
                      ) : (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          Expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Company Directory List */}
        <Card className="border-sidebar-border/40 shadow-xl bg-card">
          <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Registered Companies</CardTitle>
              <CardDescription>
                Manage all registered client instances and billing info.
              </CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or industry..."
                className="pl-9"
                value={searchCompany}
                onChange={(e) => setSearchCompany(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Company Name</TableHead>
                    <TableHead>Email / Admin</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Plan Duration</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Expiration Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                        No companies registered.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((company) => {
                      const daysLeft = getDaysRemaining(company.subscriptionEndDate);
                      const isExpired = daysLeft <= 0;
                      return (
                        <TableRow key={company._id} className="hover:bg-muted/30">
                          <TableCell className="font-semibold pl-6">{company.name}</TableCell>
                          <TableCell>{company.email}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-foreground text-xs font-semibold">
                              {company.industry || "General"}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{company.subscriptionDuration || "1 month"}</TableCell>
                          <TableCell className="font-semibold text-emerald-600">₹{(company.amountPaid ?? 0).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {formatDate(company.subscriptionEndDate)}
                          </TableCell>
                          <TableCell>
                            {isExpired ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400">
                                Expired
                              </span>
                            ) : daysLeft <= 30 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                                {daysLeft} days remaining
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                                Active
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEdit(company)}
                                className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-500/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDelete(company)}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog: Add Company */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Register New Company</DialogTitle>
              <DialogDescription>
                Create a new tenant with isolated database access and specific billing duration.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCompany} className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  placeholder="Apex Metals Ltd."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Admin Email (Username)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@apexmetals.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Login Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="industry">Industry Type</Label>
                  <select
                    id="industry"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  >
                    <option value="Steel">Steel Industry</option>
                    <option value="Textiles">Textiles</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="General">General ERP</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Subscription Plan</Label>
                  <select
                    id="duration"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.subscriptionDuration}
                    onChange={(e) => setFormData({ ...formData, subscriptionDuration: e.target.value })}
                  >
                    <option value="1 month">1 Month</option>
                    <option value="3 months">3 Months</option>
                    <option value="6 months">6 Months</option>
                    <option value="1 year">1 Year</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount Paid (INR)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.subscriptionStartDate}
                    onChange={(e) => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Tenant"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog: Edit Company */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Edit Company Details</DialogTitle>
              <DialogDescription>
                Modify name, email, subscription parameters, or renew active duration.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditCompany} className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Company Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Admin Email (Username)</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">Login Password (Leave blank to keep current)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-industry">Industry Type</Label>
                  <select
                    id="edit-industry"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  >
                    <option value="Steel">Steel Industry</option>
                    <option value="Textiles">Textiles</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="General">General ERP</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-duration">Subscription Plan</Label>
                  <select
                    id="edit-duration"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={formData.subscriptionDuration}
                    onChange={(e) => setFormData({ ...formData, subscriptionDuration: e.target.value })}
                  >
                    <option value="1 month">1 Month</option>
                    <option value="3 months">3 Months</option>
                    <option value="6 months">6 Months</option>
                    <option value="1 year">1 Year</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Amount Paid (INR)</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.subscriptionStartDate}
                    onChange={(e) => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Updating..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Alert Dialog: Confirm Delete */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the tenant <span className="font-semibold text-foreground">"{selectedCompany?.name}"</span> and all their isolated database collections (Products, Orders, Customers, Suppliers, settings). This action is irreversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCompany}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Permanently Delete Company"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // --- Standard Admin ERP Dashboard UI ---
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

      {/* Bottom Row */}
      <div className="grid gap-6">
        <RecentOrders orders={stats.recentOrders} />
      </div>
    </div>
  );
};

export default Dashboard;
