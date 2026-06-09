"use client";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Loader2, User, Building2, Shield, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const Settings = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAccountEditing, setIsAccountEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = async () => {
    if (!window.confirm("WARNING: This will recalculate tax and grand total for all historical orders where loading charges are applied. Are you sure you want to proceed?")) return;
    
    setIsRecalculating(true);
    try {
      const { data } = await api.post("/api/orders/recalculate-calculations");
      toast.success(`Recalculation complete! Updated ${data.updatedCount} orders.`);
    } catch (error: any) {
      console.error("Error during recalculation:", error);
      toast.error(error.response?.data?.message || "Failed to recalculate orders");
    } finally {
      setIsRecalculating(false);
    }
  };

  const [settings, setSettings] = useState({
    companyName: "",
    gstin: "",
    address: "",
    state: "",
    gstCode: "",
    invoicePrefix: "",
    financialYear: "",
    bankDetails: {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      branch: "",
      swiftCode: ""
    },
    email: "",
    phone: "",
    hsnCode: ""
  });

  const [accountSettings, setAccountSettings] = useState({
    name: Cookies.get("user_name") || "",
    password: "",
    confirmPassword: ""
  });

  const [activeTab, setActiveTab] = useState<"profile" | "company">("profile");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/api/company-settings");
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (id.includes("bank-")) {
      const bankField = id.replace("bank-", "");
      setSettings((prev) => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [bankField]: value
        }
      }));
    } else {
      let finalValue = value;
      if (id === "phone") {
        finalValue = value.replace(/\D/g, '').slice(0, 10);
      }
      setSettings((prev) => ({ ...prev, [id]: finalValue }));
    }
  };

  const handleSave = async () => {
    if (settings.phone && settings.phone.length !== 10) {
      return toast.error("Phone number must be exactly 10 digits");
    }
    setSaving(true);
    try {
      await api.put("/api/company-settings", settings);
      toast.success("Settings updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountSettings.password && accountSettings.password !== accountSettings.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setAccountSaving(true);
    try {
      const { data } = await api.put("/api/users/profile", {
        name: accountSettings.name,
        password: accountSettings.password || undefined
      });

      // Update cookies so the header reflects changes
      Cookies.set("user_name", data.name, { expires: 30, path: '/' });
      Cookies.set("user_role", data.role, { expires: 30, path: '/' });
      if (data.token) {
        Cookies.set("auth_token", data.token, { expires: 30, path: '/' });
      }

      toast.success("Account updated successfully");
      setAccountSettings(prev => ({ ...prev, password: "", confirmPassword: "" }));
      setIsAccountEditing(false);

      // Force a page refresh to update all header/avatar instances
      window.location.reload();
    } catch (error: any) {
      console.error("Error updating account:", error);
      toast.error(error.response?.data?.message || "Failed to update account");
    } finally {
      setAccountSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userRole = Cookies.get("user_role");

  const tabs = [
    { id: "profile", label: "Account Profile", icon: User },
    ...(userRole === "super_admin" ? [{ id: "company", label: "Company Details", icon: Building2 }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your personal profile and business configurations</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-muted",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <Card className="border-none shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">Account Profile</CardTitle>
                    <CardDescription>Update your personal information and password</CardDescription>
                  </div>
                  {!isAccountEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsAccountEditing(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsAccountEditing(false)} disabled={accountSaving}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleAccountSave} disabled={accountSaving}>
                        {accountSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAccountSave} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="profile-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="profile-name"
                            className="pl-10"
                            value={accountSettings.name}
                            onChange={(e) => setAccountSettings(prev => ({ ...prev, name: e.target.value }))}
                            disabled={!isAccountEditing}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Account Role</Label>
                        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                          <Shield className="h-4 w-4" />
                          {Cookies.get("user_role") === "super_admin" ? "Super Admin" : "Administrator"}
                        </div>
                      </div>
                    </div>

                    {isAccountEditing && (
                      <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-top-2">
                        <Separator />
                        <div>
                          <h3 className="text-sm font-medium mb-4">Change Password</h3>
                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="profile-password">New Password</Label>
                              <Input
                                id="profile-password"
                                type="password"
                                placeholder="Leave blank to keep current"
                                value={accountSettings.password}
                                onChange={(e) => setAccountSettings(prev => ({ ...prev, password: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="profile-confirm">Confirm Password</Label>
                              <Input
                                id="profile-confirm"
                                type="password"
                                value={accountSettings.confirmPassword}
                                onChange={(e) => setAccountSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "company" && userRole === "super_admin" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Company Configuration</h2>
                  <p className="text-sm text-muted-foreground">Business details and payment information</p>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Edit Details</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setIsEditing(false); fetchSettings(); }} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save All Changes
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <CardTitle>Basic Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={settings.companyName}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstin">GSTIN</Label>
                        <Input
                          id="gstin"
                          value={settings.gstin}
                          onChange={handleChange}
                          placeholder="29AAAAA0000A1Z5"
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Business Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={settings.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={settings.phone}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hsnCode">Default HSN Code</Label>
                        <Input
                          id="hsnCode"
                          value={settings.hsnCode}
                          onChange={handleChange}
                          placeholder="e.g. 7210"
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="col-span-full space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={settings.address}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={settings.state}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstCode">State Code</Label>
                        <Input
                          id="gstCode"
                          value={settings.gstCode}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <CardTitle>Bank Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="bank-accountHolderName">Account Holder Name</Label>
                        <Input
                          id="bank-accountHolderName"
                          value={settings.bankDetails.accountHolderName}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank-bankName">Bank Name</Label>
                        <Input
                          id="bank-bankName"
                          value={settings.bankDetails.bankName}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank-accountNumber">Account Number</Label>
                        <Input
                          id="bank-accountNumber"
                          value={settings.bankDetails.accountNumber}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank-ifscCode">IFSC Code</Label>
                        <Input
                          id="bank-ifscCode"
                          value={settings.bankDetails.ifscCode}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank-branch">Branch</Label>
                        <Input
                          id="bank-branch"
                          value={settings.bankDetails.branch}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank-swiftCode">SWIFT Code</Label>
                        <Input
                          id="bank-swiftCode"
                          value={settings.bankDetails.swiftCode}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Invoice Rules</span>
                      <input 
                        type="text" 
                        placeholder={isRecalculating ? "Recalculating..." : "System code..."}
                        disabled={isRecalculating}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = e.currentTarget.value.trim().toLowerCase();
                            if (val === 'recalculate') {
                              handleRecalculate();
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        className="text-[10px] bg-transparent border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 focus:outline-none w-28 text-zinc-400 placeholder:text-zinc-300 focus:border-zinc-400 focus:text-zinc-700 transition-all font-normal"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                        <Input
                          id="invoicePrefix"
                          value={settings.invoicePrefix}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="financialYear">Financial Year</Label>
                        <Input
                          id="financialYear"
                          value={settings.financialYear}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
