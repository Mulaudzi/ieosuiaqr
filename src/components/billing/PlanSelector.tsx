import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUserPlan, UserPlan } from "@/hooks/useUserPlan";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: UserPlan;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  icon: React.ElementType;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    priceMonthly: 0,
    priceAnnual: 0,
    icon: Zap,
    features: [
      "5 QR codes",
      "Basic QR types (URL, Text, Email, SMS)",
      "PNG & SVG downloads",
      "Basic customization",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For professionals and small teams",
    priceMonthly: 179,
    priceAnnual: 1718, // 20% discount
    icon: Crown,
    features: [
      "50 QR codes",
      "All QR types including WiFi, vCard, Event",
      "All download formats (PNG, SVG, PDF)",
      "Advanced customization & colors",
      "Basic scan tracking",
      "Custom branding",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    priceMonthly: 549,
    priceAnnual: 5270, // 20% discount
    icon: Building2,
    features: [
      "Unlimited QR codes",
      "All Pro features",
      "Advanced analytics & geo tracking",
      "Bulk CSV import",
      "White-label exports",
      "API access",
      "Dedicated support",
      "Custom integrations",
    ],
  },
];

interface PlanSelectorProps {
  onSelectPlan: (plan: UserPlan, isAnnual: boolean) => void;
}

export function PlanSelector({ onSelectPlan }: PlanSelectorProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const { plan: currentPlan } = useUserPlan();
  const { toast } = useToast();

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === currentPlan) {
      toast({
        title: "Current Plan",
        description: "You're already on this plan.",
      });
      return;
    }

    if (plan.id === "free") {
      toast({
        title: "Downgrade",
        description: "Please contact support to downgrade your plan.",
      });
      return;
    }

    onSelectPlan(plan.id, isAnnual);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getAnnualSavings = (plan: Plan) => {
    if (plan.priceMonthly === 0) return 0;
    const yearlyIfMonthly = plan.priceMonthly * 12;
    return yearlyIfMonthly - plan.priceAnnual;
  };

  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-muted/50">
        <Label
          htmlFor="billing-toggle"
          className={!isAnnual ? "font-semibold text-foreground" : "text-muted-foreground"}
        >
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
        />
        <Label
          htmlFor="billing-toggle"
          className={isAnnual ? "font-semibold text-foreground" : "text-muted-foreground"}
        >
          Annual
          <span className="ml-2 text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
            Save 20%
          </span>
        </Label>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          const price = isAnnual ? plan.priceAnnual : plan.priceMonthly;
          const isCurrentPlan = plan.id === currentPlan;
          const savings = getAnnualSavings(plan);

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                plan.popular
                  ? "border-primary bg-primary/5"
                  : isCurrentPlan
                  ? "border-success bg-success/5"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-success text-success-foreground text-xs font-semibold rounded-full">
                  Current Plan
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-xl ${
                    plan.popular
                      ? "bg-primary/20"
                      : isCurrentPlan
                      ? "bg-success/20"
                      : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      plan.popular
                        ? "text-primary"
                        : isCurrentPlan
                        ? "text-success"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-display font-semibold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-bold">
                    {price === 0 ? "Free" : formatPrice(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-muted-foreground text-sm">
                      /{isAnnual ? "year" : "month"}
                    </span>
                  )}
                </div>
                {isAnnual && savings > 0 && (
                  <p className="text-xs text-success mt-1">
                    Save {formatPrice(savings)} per year
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "hero" : isCurrentPlan ? "outline" : "default"}
                className="w-full"
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrentPlan || plan.id === "free"}
              >
                {isCurrentPlan
                  ? "Current Plan"
                  : plan.id === "free"
                  ? "Free Forever"
                  : `Upgrade to ${plan.name}`}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
