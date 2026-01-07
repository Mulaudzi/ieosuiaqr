import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    priceMonthly: 0,
    priceYearly: 0,
    popular: false,
    features: [
      { name: "5 QR codes", included: true },
      { name: "Basic QR types (URL, Text)", included: true },
      { name: "Standard resolution", included: true },
      { name: "Scan tracking", included: false },
      { name: "Analytics dashboard", included: false },
      { name: "Custom branding", included: false },
      { name: "Dynamic QR codes", included: false },
      { name: "API access", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    description: "For growing businesses",
    priceMonthly: 9.99,
    priceYearly: 99,
    popular: true,
    features: [
      { name: "50 QR codes", included: true },
      { name: "All QR types", included: true },
      { name: "High resolution exports", included: true },
      { name: "Basic scan tracking", included: true },
      { name: "Analytics dashboard", included: true },
      { name: "Custom colors", included: true },
      { name: "Dynamic QR codes", included: true },
      { name: "API access", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    priceMonthly: 29.99,
    priceYearly: 299,
    popular: false,
    features: [
      { name: "Unlimited QR codes", included: true },
      { name: "All QR types", included: true },
      { name: "Ultra-high resolution", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Geo-location tracking", included: true },
      { name: "Full custom branding", included: true },
      { name: "Dynamic QR codes", included: true },
      { name: "Full API access", included: true },
      { name: "24/7 Priority support", included: true },
    ],
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 lg:py-32 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Simple, Transparent{" "}
            <span className="gradient-text-accent">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-muted">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                !isYearly
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                isYearly
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">
                Save 17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "relative rounded-3xl p-8 border transition-all duration-300",
                plan.popular
                  ? "bg-card border-primary shadow-xl shadow-primary/10 scale-105"
                  : "bg-card border-border hover:border-primary/30 hover:shadow-lg"
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="font-display text-2xl font-bold mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-display font-bold">
                    ${isYearly ? plan.priceYearly : plan.priceMonthly}
                  </span>
                  {plan.priceMonthly > 0 && (
                    <span className="text-muted-foreground">
                      /{isYearly ? "year" : "month"}
                    </span>
                  )}
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                        <X className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        feature.included
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                variant={plan.popular ? "hero" : "outline"}
                size="lg"
                className="w-full"
                asChild
              >
                <Link to="/signup">
                  {plan.priceMonthly === 0 ? "Get Started Free" : "Start Free Trial"}
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Need a custom solution for your enterprise?
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link to="/contact">Contact Sales</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
