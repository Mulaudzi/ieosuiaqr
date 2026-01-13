import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Lock, 
  ArrowLeft, 
  Check, 
  Shield,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useUserPlan, UserPlan } from "@/hooks/useUserPlan";
import { useToast } from "@/hooks/use-toast";
import { billingApi } from "@/services/api/billing";
import { useAuth } from "@/contexts/AuthContext";

interface PayFastCheckoutProps {
  selectedPlan: UserPlan;
  isAnnual: boolean;
  onBack: () => void;
  onSuccess: () => void;
}

const planDetails = {
  pro: {
    name: "Pro",
    priceMonthly: 179,
    priceAnnual: 1718,
  },
  enterprise: {
    name: "Enterprise",
    priceMonthly: 549,
    priceAnnual: 5270,
  },
};

export function PayFastCheckout({ 
  selectedPlan, 
  isAnnual, 
  onBack, 
  onSuccess 
}: PayFastCheckoutProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { updatePlan } = useUserPlan();
  const { toast } = useToast();

  // Pre-fill with user data
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setName(user.name || "");
    }
  }, [user]);

  if (selectedPlan === "free") return null;

  const plan = planDetails[selectedPlan];
  const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
  const period = isAnnual ? "year" : "month";

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePayFastCheckout = async () => {
    if (!email || !name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Map plan names to IDs (backend uses numeric IDs)
    const planIdMap: Record<string, number> = { free: 1, pro: 2, enterprise: 3 };
    const planId = planIdMap[selectedPlan] || 2;

    try {
      // Call the real checkout API
      const response = await billingApi.checkout({
        plan_id: planId,
        billing_cycle: isAnnual ? "annual" : "monthly",
      });

      if (response.success && response.data?.payment_url) {
        // Redirect to PayFast payment page
        window.location.href = response.data.payment_url;
        return;
      }

      // If no redirect URL, the plan might have been applied directly (e.g., trial or free upgrade)
      if (response.success) {
        updatePlan(selectedPlan);
        toast({
          title: "Success!",
          description: `You've been upgraded to the ${plan.name} plan.`,
        });
        onSuccess();
      }
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      toast({
        title: "Payment Failed",
        description: apiError.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-lg mx-auto"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to plans
      </button>

      {/* Order Summary */}
      <div className="p-6 rounded-2xl bg-card border border-border mb-6">
        <h3 className="font-display font-semibold mb-4">Order Summary</h3>
        
        <div className="flex justify-between items-center py-3">
          <div>
            <p className="font-medium">{plan.name} Plan</p>
            <p className="text-sm text-muted-foreground">
              {isAnnual ? "Annual subscription" : "Monthly subscription"}
            </p>
          </div>
          <p className="font-semibold">{formatPrice(price)}</p>
        </div>
        
        <Separator className="my-3" />
        
        <div className="flex justify-between items-center py-3">
          <p className="font-semibold">Total</p>
          <div className="text-right">
            <p className="text-xl font-display font-bold">{formatPrice(price)}</p>
            <p className="text-xs text-muted-foreground">per {period}</p>
          </div>
        </div>

        {isAnnual && (
          <div className="mt-3 p-3 rounded-xl bg-success/10 border border-success/20">
            <p className="text-sm text-success font-medium flex items-center gap-2">
              <Check className="w-4 h-4" />
              You're saving 20% with annual billing!
            </p>
          </div>
        )}
      </div>

      {/* Billing Information */}
      <div className="p-6 rounded-2xl bg-card border border-border mb-6">
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Billing Information
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billing-name">Full Name *</Label>
            <Input
              id="billing-name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-email">Email Address *</Label>
            <Input
              id="billing-email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your receipt will be sent to this email
            </p>
          </div>
        </div>
      </div>

      {/* PayFast Button */}
      <Button
        variant="hero"
        size="lg"
        className="w-full mb-4"
        onClick={handlePayFastCheckout}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Pay with PayFast
          </>
        )}
      </Button>

      {/* Security Notice */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4" />
        <p>Secured by PayFast • 256-bit SSL encryption</p>
      </div>

      {/* PayFast Logo */}
      <div className="mt-6 flex justify-center">
        <div className="px-4 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          Powered by <span className="font-semibold">PayFast</span> 🇿🇦
        </div>
      </div>
    </motion.div>
  );
}
