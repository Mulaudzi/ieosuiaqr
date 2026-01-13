import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Crown,
  Zap,
  Building2,
  Calendar,
  CreditCard,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Settings,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { billingApi, SubscriptionStatus } from "@/services/api/billing";
import { useUserPlan, UserPlan } from "@/hooks/useUserPlan";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { PlanChangeModal } from "@/components/billing/PlanChangeModal";
import { PaymentRetryStatus } from "@/components/billing/PaymentRetryStatus";

const planIcons: Record<string, typeof Crown> = {
  free: Zap,
  pro: Crown,
  enterprise: Building2,
};

const planColors: Record<string, string> = {
  free: "text-muted-foreground",
  pro: "text-primary",
  enterprise: "text-accent",
};

export default function Subscription() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { plan: currentPlan, limits, refreshPlan } = useUserPlan();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [targetPlan, setTargetPlan] = useState<UserPlan>("pro");
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const response = await billingApi.getSubscriptionStatus();
      if (response.success && response.data) {
        setSubscriptionStatus(response.data);
      }
    } catch (error) {
      console.error("Failed to load subscription status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await billingApi.syncSubscription();
      if (response.success) {
        await loadSubscriptionStatus();
        await refreshPlan();
        toast({
          title: "Subscription synced",
          description: "Your subscription status has been updated.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "Could not sync subscription. Please try again.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysUntilRenewal = () => {
    if (!subscriptionStatus?.renewal_date) return null;
    const renewal = new Date(subscriptionStatus.renewal_date);
    const now = new Date();
    const diffTime = renewal.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const planKey = currentPlan.toLowerCase();
  const PlanIcon = planIcons[planKey] || Zap;
  const daysUntilRenewal = getDaysUntilRenewal();

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="lg:ml-64">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-6 py-4">
            <h1 className="font-display text-2xl font-bold">Subscription</h1>
            <p className="text-sm text-muted-foreground">
              Manage your subscription and billing
            </p>
          </div>
        </header>

        <div className="p-6 max-w-4xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Payment Retry Warning Banner */}
              <PaymentRetryStatus />

              {/* Current Plan Card */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        planKey === "enterprise"
                          ? "bg-accent/20"
                          : planKey === "pro"
                          ? "bg-primary/20"
                          : "bg-muted"
                      }`}
                    >
                      <PlanIcon className={`w-8 h-8 ${planColors[planKey]}`} />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold capitalize">
                        {currentPlan} Plan
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            subscriptionStatus?.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {subscriptionStatus?.status || "Active"}
                        </Badge>
                        {subscriptionStatus?.frequency && (
                          <Badge variant="outline" className="capitalize">
                            {subscriptionStatus.frequency}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span className="ml-2">Sync</span>
                  </Button>
                </div>

                {/* Subscription Details */}
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm">Current Price</span>
                    </div>
                    <p className="font-display text-2xl font-bold">
                      {subscriptionStatus?.price
                        ? formatCurrency(subscriptionStatus.price)
                        : "Free"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      /{subscriptionStatus?.frequency || "month"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Next Renewal</span>
                    </div>
                    <p className="font-display text-lg font-bold">
                      {formatDate(subscriptionStatus?.renewal_date || null)}
                    </p>
                    {daysUntilRenewal !== null && currentPlan !== "free" && (
                      <p className="text-xs text-muted-foreground">
                        {daysUntilRenewal} days remaining
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Last Payment</span>
                    </div>
                    <p className="font-display text-lg font-bold">
                      {formatDate(subscriptionStatus?.last_payment_date || null)}
                    </p>
                  </div>
                </div>

                {/* Renewal Progress */}
                {currentPlan !== "free" && daysUntilRenewal !== null && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Billing cycle progress</span>
                      <span className="font-medium">
                        {30 - daysUntilRenewal}/30 days
                      </span>
                    </div>
                    <Progress value={((30 - daysUntilRenewal) / 30) * 100} />
                  </div>
                )}

                <Separator className="my-6" />

                {/* Plan Features */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-4">Your Plan Includes</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {subscriptionStatus?.features?.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="p-4 rounded-xl bg-muted/30">
                  <h4 className="font-semibold mb-3">Usage</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">QR Codes</span>
                        <span className="font-medium">
                          {limits.maxQRCodes === Infinity
                            ? "Unlimited"
                            : `0 / ${limits.maxQRCodes}`}
                        </span>
                      </div>
                      {limits.maxQRCodes !== Infinity && (
                        <Progress value={0} className="h-2" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Change Options */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="font-display font-semibold mb-4">Change Plan</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {currentPlan !== "pro" && (
                    <Button
                      variant={currentPlan === "free" ? "hero" : "outline"}
                      className="h-auto py-4 flex-col items-start"
                      onClick={() => {
                        setTargetPlan("pro");
                        setIsAnnualBilling(false);
                        setShowPlanChangeModal(true);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {currentPlan === "free" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )}
                        <span className="font-semibold">
                          {currentPlan === "free" ? "Upgrade to" : "Downgrade to"} Pro
                        </span>
                      </div>
                      <span className="text-xs opacity-70">
                        R179/month • 50 QR codes
                      </span>
                    </Button>
                  )}

                  {currentPlan !== "enterprise" && (
                    <Button
                      variant="hero"
                      className="h-auto py-4 flex-col items-start"
                      onClick={() => {
                        setTargetPlan("enterprise");
                        setIsAnnualBilling(false);
                        setShowPlanChangeModal(true);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowUp className="w-4 h-4" />
                        <span className="font-semibold">Upgrade to Enterprise</span>
                      </div>
                      <span className="text-xs opacity-70">
                        R549/month • Unlimited QR codes
                      </span>
                    </Button>
                  )}

                  {currentPlan !== "free" && (
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col items-start text-muted-foreground"
                      onClick={() => {
                        setTargetPlan("free");
                        setIsAnnualBilling(false);
                        setShowPlanChangeModal(true);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowDown className="w-4 h-4" />
                        <span className="font-semibold">Downgrade to Free</span>
                      </div>
                      <span className="text-xs">
                        Cancel subscription • 5 QR codes
                      </span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  asChild
                >
                  <Link to="/dashboard/settings?tab=billing">
                    <FileText className="w-5 h-5" />
                    <span>View Invoices</span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  asChild
                >
                  <Link to="/dashboard/settings?tab=billing">
                    <CreditCard className="w-5 h-5" />
                    <span>Payment History</span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  asChild
                >
                  <Link to="/support">
                    <Settings className="w-5 h-5" />
                    <span>Billing Support</span>
                  </Link>
                </Button>
              </div>

              {/* Important Notice */}
              {currentPlan !== "free" && (
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Subscription Notice</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your subscription will automatically renew on{" "}
                        {formatDate(subscriptionStatus?.renewal_date || null)}. You can
                        cancel or change your plan at any time.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Plan Change Modal */}
      <PlanChangeModal
        open={showPlanChangeModal}
        onOpenChange={setShowPlanChangeModal}
        targetPlan={targetPlan}
        isAnnual={isAnnualBilling}
        onSuccess={() => {
          loadSubscriptionStatus();
          refreshPlan();
        }}
      />
    </div>
  );
}
