import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Settings = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAccountEditing, setIsAccountEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);

  const [settings, setSettings] = useState({
    companyName: "",
    gstin: "",
    address: "",
    state: "",
    gstCode: "",
    invoicePrefix: "",
    financialYear: "",
    isGstEnabled: true,
    bankDetails: {
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      branch: ""
    },
    email: "",
    phone: ""
  });

  const [accountSettings, setAccountSettings] = useState({
    name: Cookies.get("user_name") || "",
    password: "",
    confirmPassword: ""
  });

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

  const handleSave = async () => {
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
      setSettings((prev) => ({ ...prev, [id]: value }));
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your application and company details</p>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>Edit Settings</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { setIsEditing(false); fetchSettings(); }} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>Basic information for your business</CardDescription>
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="col-span-full space-y-2">
                    <Label htmlFor="address">Full Address</Label>
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
                    <Label htmlFor="gstCode">GST State Code</Label>
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

            <Card>
              <CardHeader>
                <CardTitle>Invoice Settings</CardTitle>
                <CardDescription>Configure how your invoices are generated</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">GST Calculation (CGST/SGST/IGST)</p>
                    <p className="text-sm text-muted-foreground">Enable or disable GST fields in invoices</p>
                  </div>
                  <Switch
                    checked={settings.isGstEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, isGstEnabled: checked }))}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>Your bank information for invoice payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-4 lg:pt-16">
          <Card className="sticky top-24">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Account Profile</CardTitle>
                {!isAccountEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsAccountEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAccountSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={accountSettings.name}
                    onChange={(e) => setAccountSettings(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isAccountEditing}
                  />
                </div>

                {isAccountEditing && (
                  <>
                    <Separator />
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
                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setIsAccountEditing(false);
                          setAccountSettings(prev => ({
                            ...prev,
                            name: Cookies.get("user_name") || "",
                            password: "",
                            confirmPassword: ""
                          }));
                        }}
                        disabled={accountSaving}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1" disabled={accountSaving}>
                        {accountSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
