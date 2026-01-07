import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PlanSelector } from "@/components/billing/PlanSelector";
import { PayFastCheckout } from "@/components/billing/PayFastCheckout";
import { InvoiceHistory } from "@/components/billing/InvoiceHistory";
import { useUserPlan, UserPlan } from "@/hooks/useUserPlan";
import {
  QrCode,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  Crown,
  User,
  Lock,
  Bell,
  CreditCard,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [scanAlerts, setScanAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // Billing state
  const [checkoutPlan, setCheckoutPlan] = useState<UserPlan | null>(null);
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);
  
  const { plan: currentPlan, limits } = useUserPlan();
  const { toast } = useToast();

  // Handle payment callback
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      toast({
        title: "Payment Successful!",
        description: "Your plan has been upgraded.",
      });
    } else if (paymentStatus === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleProfileSave = () => {
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Password changed",
      description: "Your password has been updated successfully.",
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleNotificationsSave = () => {
    toast({
      title: "Preferences saved",
      description: "Your notification preferences have been updated.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:block">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">
              <span className="gradient-text">IEOSUIA</span>
            </span>
          </Link>

          <nav className="space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
            >
              <QrCode className="w-5 h-5" />
              My QR Codes
            </Link>
            <Link
              to="/dashboard/analytics"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </Link>
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium"
            >
              <SettingsIcon className="w-5 h-5" />
              Settings
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-24 left-4 right-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Get unlimited QR codes and advanced analytics
            </p>
            <Button variant="hero" size="sm" className="w-full" asChild>
              <Link to="/pricing">Upgrade Now</Link>
            </Button>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">JD</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">Free Plan</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-6 py-4">
            <h1 className="font-display text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
        </header>

        <div className="p-6">
          <Tabs defaultValue="profile" className="max-w-3xl">
            <TabsList className="mb-6">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Lock className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Billing
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h3 className="font-display font-semibold mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-display font-bold text-primary">
                          JD
                        </span>
                      </div>
                      <div>
                        <Button variant="outline" size="sm">
                          Change Avatar
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG or GIF. Max 2MB.
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button variant="hero" onClick={handleProfileSave}>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h3 className="font-display font-semibold mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <Button variant="hero" onClick={handlePasswordChange}>
                      Update Password
                    </Button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-success" />
                    <h3 className="font-display font-semibold">Two-Factor Authentication</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add an extra layer of security to your account by enabling two-factor
                    authentication.
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <h3 className="font-display font-semibold mb-6">Email Notifications</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your account
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Scan Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when your QR codes reach scan milestones
                      </p>
                    </div>
                    <Switch checked={scanAlerts} onCheckedChange={setScanAlerts} />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Report</p>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of your QR code performance
                      </p>
                    </div>
                    <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new features and promotions
                      </p>
                    </div>
                    <Switch
                      checked={marketingEmails}
                      onCheckedChange={setMarketingEmails}
                    />
                  </div>

                  <Button variant="hero" onClick={handleNotificationsSave}>
                    <Check className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {checkoutPlan ? (
                  <PayFastCheckout
                    selectedPlan={checkoutPlan}
                    isAnnual={isAnnualBilling}
                    onBack={() => setCheckoutPlan(null)}
                    onSuccess={() => setCheckoutPlan(null)}
                  />
                ) : (
                  <>
                    {/* Current Plan Summary */}
                    <div className="p-6 rounded-2xl bg-card border border-border">
                      <h3 className="font-display font-semibold mb-4">Current Plan</h3>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${
                            currentPlan === "enterprise" 
                              ? "bg-accent/20" 
                              : currentPlan === "pro" 
                              ? "bg-primary/20" 
                              : "bg-muted"
                          }`}>
                            <Crown className={`w-5 h-5 ${
                              currentPlan === "enterprise"
                                ? "text-accent"
                                : currentPlan === "pro"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`} />
                          </div>
                          <div>
                            <p className="font-semibold capitalize">{currentPlan} Plan</p>
                            <p className="text-sm text-muted-foreground">
                              {limits.maxQRCodes === Infinity 
                                ? "Unlimited" 
                                : limits.maxQRCodes} QR codes • {
                                  currentPlan === "enterprise" 
                                    ? "All features" 
                                    : currentPlan === "pro" 
                                    ? "Premium features" 
                                    : "Basic features"
                                }
                            </p>
                          </div>
                        </div>
                        {currentPlan === "free" && (
                          <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-full">
                            Free Forever
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 rounded-xl bg-muted/30">
                          <p className="text-2xl font-display font-bold">4/{limits.maxQRCodes === Infinity ? "∞" : limits.maxQRCodes}</p>
                          <p className="text-xs text-muted-foreground">QR Codes Used</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30">
                          <p className="text-2xl font-display font-bold">2,102</p>
                          <p className="text-xs text-muted-foreground">Total Scans</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30">
                          <p className="text-2xl font-display font-bold">∞</p>
                          <p className="text-xs text-muted-foreground">Days Left</p>
                        </div>
                      </div>
                    </div>

                    {/* Plan Selection */}
                    <div className="p-6 rounded-2xl bg-card border border-border">
                      <h3 className="font-display font-semibold mb-6">
                        {currentPlan === "free" ? "Upgrade Your Plan" : "Change Plan"}
                      </h3>
                      <PlanSelector 
                        onSelectPlan={(plan, isAnnual) => {
                          setCheckoutPlan(plan);
                          setIsAnnualBilling(isAnnual);
                        }}
                      />
                    </div>

                    {/* Invoice History */}
                    <InvoiceHistory />

                    {/* Danger Zone */}
                    <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20">
                      <h3 className="font-display font-semibold text-destructive mb-2">
                        Danger Zone
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Once you delete your account, there is no going back. Please be
                        certain.
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your
                              account and remove all your data including QR codes and
                              analytics.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete Account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
