import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  Loader2,
  AlertCircle,
  CreditCard,
  Calendar,
  Zap,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { billingApi, ProrationPreview } from "@/services/api/billing";
import { useUserPlan, UserPlan } from "@/hooks/useUserPlan";

interface PlanChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPlan: UserPlan;
  isAnnual: boolean;
  onSuccess: () => void;
}

const planDetails: Record<UserPlan, { name: string; icon: typeof Crown; color: string }> = {
  free: { name: "Free", icon: Zap, color: "text-muted-foreground" },
  pro: { name: "Pro", icon: Zap, color: "text-primary" },
  enterprise: { name: "Enterprise", icon: Crown, color: "text-accent" },
};

export function PlanChangeModal({
  open,
  onOpenChange,
  targetPlan,
  isAnnual,
  onSuccess,
}: PlanChangeModalProps) {
  const { toast } = useToast();
  const { plan: currentPlan, refreshPlan } = useUserPlan();
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [proration, setProration] = useState<ProrationPreview | null>(null);
  const [confirmDowngrade, setConfirmDowngrade] = useState(false);

  const isUpgrade =
    (currentPlan === "free" && (targetPlan === "pro" || targetPlan === "enterprise")) ||
    (currentPlan === "pro" && targetPlan === "enterprise");
  const isDowngrade =
    (currentPlan === "enterprise" && (targetPlan === "pro" || targetPlan === "free")) ||
    (currentPlan === "pro" && targetPlan === "free");

  // Load proration preview when modal opens
  useEffect(() => {
    if (open && targetPlan !== currentPlan) {
      loadProrationPreview();
    }
  }, [open, targetPlan, isAnnual]);

  const loadProrationPreview = async () => {
    setIsPreviewLoading(true);
    try {
      const response = await billingApi.getProrationPreview({
        plan: targetPlan === "pro" ? "Pro" : "Enterprise",
        frequency: isAnnual ? "annual" : "monthly",
      });
      if (response.success && response.data) {
        setProration(response.data);
      }
    } catch (error) {
      console.error("Failed to load proration preview:", error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleChangePlan = async () => {
    if (isDowngrade && !confirmDowngrade) {
      toast({
        variant: "destructive",
        title: "Please confirm downgrade",
        description: "Check the confirmation box to proceed with downgrade.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await billingApi.changePlan({
        plan: targetPlan === "pro" ? "Pro" : "Enterprise",
        frequency: isAnnual ? "annual" : "monthly",
      });

      if (response.success) {
        // Check if we need to redirect to payment
        if (response.data && 'payment_url' in response.data) {
          window.location.href = response.data.payment_url;
          return;
        }

        // Plan changed successfully without payment (credit applied)
        await refreshPlan();
        toast({
          title: "Plan changed successfully!",
          description: isUpgrade
            ? `You're now on the ${planDetails[targetPlan].name} plan.`
            : `Your plan will change to ${planDetails[targetPlan].name} at the end of your billing cycle.`,
        });
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Failed to change plan",
        description: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const CurrentIcon = planDetails[currentPlan].icon;
  const TargetIcon = planDetails[targetPlan].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUpgrade ? (
              <ArrowUp className="w-5 h-5 text-success" />
            ) : (
              <ArrowDown className="w-5 h-5 text-warning" />
            )}
            {isUpgrade ? "Upgrade" : "Downgrade"} Plan
          </DialogTitle>
          <DialogDescription>
            {isUpgrade
              ? "Unlock more features with an upgraded plan"
              : "Change to a lower tier plan"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Change Visualization */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center p-4 rounded-xl bg-muted/50">
              <CurrentIcon
                className={`w-8 h-8 mb-2 ${planDetails[currentPlan].color}`}
              />
              <span className="text-sm font-medium">
                {planDetails[currentPlan].name}
              </span>
              <Badge variant="outline" className="mt-1">
                Current
              </Badge>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div
              className={`flex flex-col items-center p-4 rounded-xl ${
                isUpgrade ? "bg-primary/10 ring-2 ring-primary" : "bg-muted/50"
              }`}
            >
              <TargetIcon
                className={`w-8 h-8 mb-2 ${planDetails[targetPlan].color}`}
              />
              <span className="text-sm font-medium">
                {planDetails[targetPlan].name}
              </span>
              <Badge
                variant={isUpgrade ? "default" : "secondary"}
                className="mt-1"
              >
                {isAnnual ? "Annual" : "Monthly"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Proration Details */}
          {isPreviewLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : proration ? (
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Billing Summary
              </h4>

              <div className="space-y-3 p-4 rounded-xl bg-muted/50">
                {isUpgrade ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        New plan price ({isAnnual ? "annual" : "monthly"})
                      </span>
                      <span>{formatCurrency(proration.new_plan_price)}</span>
                    </div>
                    {proration.credit_remaining > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Credit from current plan
                        </span>
                        <span className="text-success">
                          -{formatCurrency(proration.credit_remaining)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Amount due today</span>
                      <span className="text-primary">
                        {formatCurrency(proration.amount_due)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3 text-sm">
                      <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Changes at end of cycle</p>
                        <p className="text-muted-foreground">
                          Your current plan will remain active until{" "}
                          <span className="font-medium">
                            {proration.effective_date}
                          </span>
                        </p>
                      </div>
                    </div>
                    {proration.credit_remaining > 0 && (
                      <div className="flex items-start gap-3 text-sm">
                        <CreditCard className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">No refund for remaining time</p>
                          <p className="text-muted-foreground">
                            You'll continue to have access to{" "}
                            {planDetails[currentPlan].name} features until the
                            end of your billing period.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {proration.days_remaining > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {proration.days_remaining} days remaining in current billing
                  cycle
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Unable to load billing preview
            </div>
          )}

          {/* Downgrade Confirmation */}
          {isDowngrade && (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Before you downgrade</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• You'll lose access to premium features</li>
                    <li>• QR codes exceeding limits won't be deleted</li>
                    <li>• You can't create new ones until within limits</li>
                  </ul>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      id="confirm-downgrade"
                      checked={confirmDowngrade}
                      onCheckedChange={setConfirmDowngrade}
                    />
                    <Label htmlFor="confirm-downgrade" className="text-sm">
                      I understand and want to proceed
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant={isUpgrade ? "hero" : "default"}
              className="flex-1"
              onClick={handleChangePlan}
              disabled={isLoading || isPreviewLoading || (isDowngrade && !confirmDowngrade)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {isUpgrade
                    ? `Pay ${proration ? formatCurrency(proration.amount_due) : ""}`
                    : "Confirm Downgrade"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
