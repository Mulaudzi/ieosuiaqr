import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import { authApi } from "@/services/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { PasswordStrengthIndicator, getPasswordScore } from "@/components/auth/PasswordStrengthIndicator";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
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
  Loader2,
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [scanAlerts, setScanAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  
  // Billing state
  const [checkoutPlan, setCheckoutPlan] = useState<UserPlan | null>(null);
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);

  // 2FA state
  const [show2FASetup, setShow2FASetup] = useState(false);
  
  const { plan: currentPlan, limits, isPro } = useUserPlan();
  const { toast } = useToast();
  const { user, logout, updateUser, refreshUser } = useAuth();

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setIsLoadingProfile(false);
    }
  }, [user]);

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      // Error already handled by logout
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleProfileSave = async () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter your name.",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await authApi.updateProfile({ name, email });
      if (response.success && response.data) {
        // Update user in auth context
        updateUser(response.data);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      }
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 422) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: err.message || "Please check your input.",
        });
      } else if (err.status === 409) {
        toast({
          variant: "destructive",
          title: "Email already in use",
          description: "This email address is already associated with another account.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: err.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast({
        variant: "destructive",
        title: "Current password required",
        description: "Please enter your current password.",
      });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: passwordError,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your new passwords match.",
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await authApi.updateProfile({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      
      if (response.success) {
        toast({
          title: "Password changed",
          description: "Your password has been updated successfully.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 401 || err.status === 422) {
        toast({
          variant: "destructive",
          title: "Incorrect password",
          description: "Your current password is incorrect.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: err.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleNotificationsSave = async () => {
    setIsSavingNotifications(true);
    try {
      // Store notifications in localStorage for now (could be API in future)
      localStorage.setItem("notification_preferences", JSON.stringify({
        emailNotifications,
        scanAlerts,
        weeklyReport,
        marketingEmails,
      }));
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Load notification preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem("notification_preferences");
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setEmailNotifications(prefs.emailNotifications ?? true);
        setScanAlerts(prefs.scanAlerts ?? true);
        setWeeklyReport(prefs.weeklyReport ?? false);
        setMarketingEmails(prefs.marketingEmails ?? false);
      } catch {
        // Use defaults
      }
    }
  }, []);

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
              <Link to="/dashboard/settings?tab=billing">Upgrade Now</Link>
            </Button>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U"}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize">{currentPlan} Plan</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
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
                          {name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U"}
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

                    <Button variant="hero" onClick={handleProfileSave} disabled={isSavingProfile || isLoadingProfile}>
                      {isSavingProfile ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      {isSavingProfile ? "Saving..." : "Save Changes"}
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

                    <Button variant="hero" onClick={handlePasswordChange} disabled={isSavingPassword}>
                      {isSavingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
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
                  <Button 
                    variant="outline"
                    onClick={() => setShow2FASetup(true)}
                  >
                    Enable 2FA
                  </Button>
                </div>

                {/* Password Strength for new password */}
                {newPassword && (
                  <div className="p-4 rounded-xl bg-muted/50">
                    <PasswordStrengthIndicator password={newPassword} />
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* 2FA Setup Modal */}
            <TwoFactorSetup
              open={show2FASetup}
              onOpenChange={setShow2FASetup}
              onSuccess={() => {
                refreshUser();
                toast({ title: "2FA Enabled!", description: "Your account is now more secure." });
              }}
            />

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <NotificationSettings />
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
                            <AlertDialogAction 
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={async () => {
                                try {
                                  const response = await fetch('/api/user/delete', {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                                      'Content-Type': 'application/json'
                                    }
                                  });
                                  if (response.ok) {
                                    localStorage.clear();
                                    toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
                                    navigate("/login");
                                  } else {
                                    throw new Error('Failed to delete');
                                  }
                                } catch {
                                  toast({ variant: "destructive", title: "Error", description: "Failed to delete account. Please try again." });
                                }
                              }}
                            >
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
