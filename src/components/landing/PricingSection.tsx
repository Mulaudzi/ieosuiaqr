import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Sparkles, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    priceMonthly: 0,
    priceYearly: 0,
    popular: false,
    features: [
      { name: "5 QR codes", included: true },
      { name: "3 inventory items (read-only)", included: true },
      { name: "Basic QR types (URL, Text)", included: true },
      { name: "Standard resolution", included: true },
      { name: "Scan tracking", included: false },
      { name: "Analytics dashboard", included: false },
      { name: "Custom branding", included: false },
      { name: "Priority support", included: false },
    ],
    advancedFeatures: [
      { category: "QR Codes", items: ["URL & Text QR types", "Standard PNG export", "Basic color options"] },
      { category: "Inventory", items: ["View-only access", "3 item limit", "Basic status tracking"] },
      { category: "Analytics", items: ["Not available"] },
      { category: "Support", items: ["Community forums", "Knowledge base"] },
    ],
  },
  {
    name: "Pro",
    description: "For growing businesses",
    priceMonthly: 179,
    priceYearly: 1728,
    popular: true,
    features: [
      { name: "50 QR codes", included: true },
      { name: "100 inventory items (editable)", included: true },
      { name: "All QR types", included: true },
      { name: "Basic scan tracking", included: true },
      { name: "Analytics dashboard", included: true },
      { name: "Custom colors & logos", included: true },
      { name: "Dynamic QR codes", included: true },
      { name: "Priority support", included: false },
    ],
    advancedFeatures: [
      { category: "QR Codes", items: ["All 8 QR types (URL, vCard, WiFi, etc.)", "Dynamic QR (update content anytime)", "Custom colors & logo embedding", "High-resolution PNG, SVG, PDF export", "Bulk QR generation (up to 20)"] },
      { category: "Inventory", items: ["Full edit access", "100 items with QR linking", "Status change history", "Print QR labels", "CSV export"] },
      { category: "Analytics", items: ["Scan frequency charts", "Status distribution", "Top items by activity", "30-day trend reports", "CSV/PDF export"] },
      { category: "Alerts & Notifications", items: ["Email status change alerts", "Maintenance reminders", "Low activity warnings"] },
      { category: "Support", items: ["Email support", "48-hour response time", "Video tutorials"] },
    ],
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    priceMonthly: 549,
    priceYearly: 5270,
    popular: false,
    features: [
      { name: "Unlimited QR codes", included: true },
      { name: "Unlimited inventory (team sharing)", included: true },
      { name: "Advanced analytics & geo-tracking", included: true },
      { name: "Full custom branding", included: true },
      { name: "Multi-user access", included: true },
      { name: "Bulk operations", included: true },
      { name: "Dynamic QR codes", included: true },
      { name: "24/7 Priority support", included: true },
    ],
    advancedFeatures: [
      { category: "QR Codes", items: ["Unlimited QR codes", "Bulk generation (unlimited)", "White-label branding", "Custom domains"] },
      { category: "Inventory", items: ["Unlimited items", "Team sharing & access control", "Bulk CSV import with auto-QR", "Full audit trail", "Multi-location tracking"] },
      { category: "Analytics", items: ["Real-time dashboards", "Geographic heatmaps", "Device & browser breakdown", "Custom date ranges", "Scheduled reports"] },
      { category: "Alerts & Notifications", items: ["Email & SMS alerts", "Custom alert rules", "Maintenance schedules", "Low-stock warnings", "Team notifications"] },
      { category: "Security & Compliance", items: ["SSO integration", "Role-based access", "Audit logs", "Data encryption", "GDPR & POPIA compliance tools"] },
      { category: "Support", items: ["24/7 priority support", "Dedicated account manager", "Custom onboarding", "SLA guarantees", "Phone support"] },
    ],
  },
];

const pricingFaqs = [
  {
    question: "Can I try before I buy?",
    answer: "Yes! All paid plans come with a free trial. You can also start with our Free plan which includes 5 QR codes and basic features - no credit card required."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept payments through PayFast, which supports credit/debit cards, instant EFT, and various South African payment methods. All prices are in South African Rand (ZAR) and include VAT."
  },
  {
    question: "Can I change plans at any time?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, changes take effect at your next billing cycle."
  },
  {
    question: "What happens to my QR codes if I downgrade?",
    answer: "Your existing QR codes remain active. However, if you exceed the new plan's limits, you won't be able to create new ones until you're within the limits or upgrade again."
  },
  {
    question: "Is there a discount for annual billing?",
    answer: "Yes! When you choose annual billing, you save 20% compared to monthly billing. This applies to both Pro and Enterprise plans."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact us within 14 days of purchase for a full refund."
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel anytime from your account settings. Your access continues until the end of your current billing period. We don't believe in lock-in contracts."
  },
  {
    question: "Do you offer discounts for NGOs or educational institutions?",
    answer: "Yes! We offer special pricing for registered non-profits, NGOs, churches, and educational institutions. Contact us at hello@ieosuia.com for details."
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

  const togglePlan = (planName: string) => {
    setExpandedPlans(prev => ({ ...prev, [planName]: !prev[planName] }));
  };

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
                Save 20%
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
                "relative rounded-3xl border transition-all duration-300",
                plan.popular
                  ? "bg-card border-primary shadow-xl shadow-primary/10 scale-105 mt-4"
                  : "bg-card border-border hover:border-primary/30 hover:shadow-lg"
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
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
                      R{isYearly ? plan.priceYearly : plan.priceMonthly}
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
                  className="w-full mb-4"
                  asChild
                >
                  <Link to="/signup">
                    {plan.priceMonthly === 0 ? "Get Started Free" : "Start Free Trial"}
                  </Link>
                </Button>

                {/* Advanced Features Collapsible */}
                <Collapsible 
                  open={expandedPlans[plan.name]} 
                  onOpenChange={() => togglePlan(plan.name)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
                      {expandedPlans[plan.name] ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          View All Features
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <div className="space-y-4 border-t pt-4">
                      {plan.advancedFeatures.map((category) => (
                        <div key={category.category}>
                          <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                            {category.category}
                          </h4>
                          <ul className="space-y-1.5">
                            {category.items.map((item, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                <Check className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
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

        {/* Pricing FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-24 max-w-3xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <HelpCircle className="w-4 h-4" />
              Pricing FAQ
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold mb-4">
              Common Questions About Pricing
            </h3>
            <p className="text-muted-foreground">
              Got questions? We've got answers.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {pricingFaqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="bg-card border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-foreground font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
