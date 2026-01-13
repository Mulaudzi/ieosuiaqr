import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Store,
  Utensils,
  Building2,
  Ticket,
  Package,
  GraduationCap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const solutions = [
  {
    icon: Package,
    title: "Inventory & Asset Tracking",
    description:
      "Track equipment, products, and assets with smart QR codes. Perfect for churches, schools, warehouses, and events.",
    examples: ["Church equipment", "School books", "Shop stock", "Event check-in"],
    benefits: [
      "Real-time location tracking",
      "Automated inventory counts",
      "Loss prevention alerts",
      "Maintenance scheduling",
    ],
    color: "primary",
  },
  {
    icon: Store,
    title: "Retail & E-commerce",
    description:
      "Link to product pages, promotions, and loyalty programs. Track customer engagement and boost sales.",
    examples: ["Product packaging", "In-store displays", "Receipt marketing"],
    benefits: [
      "Instant product information",
      "Customer engagement tracking",
      "Promotion analytics",
      "Loyalty program integration",
    ],
    color: "accent",
  },
  {
    icon: Utensils,
    title: "Restaurants & Cafes",
    description:
      "Digital menus, contactless ordering, and customer feedback collection for modern dining experiences.",
    examples: ["Table menus", "Takeaway orders", "Review collection"],
    benefits: [
      "Contactless ordering",
      "Easy menu updates",
      "Customer feedback",
      "Reduced printing costs",
    ],
    color: "success",
  },
  {
    icon: Building2,
    title: "Real Estate",
    description:
      "Virtual tours, property details, and agent contact information accessible with a single scan.",
    examples: ["Property signs", "Brochures", "Open house materials"],
    benefits: [
      "24/7 property access",
      "Lead generation",
      "Virtual tour links",
      "Instant agent contact",
    ],
    color: "warning",
  },
  {
    icon: Ticket,
    title: "Events & Entertainment",
    description:
      "Ticketing, event schedules, and exclusive content access for memorable experiences.",
    examples: ["Event tickets", "Venue navigation", "VIP experiences"],
    benefits: [
      "Quick check-in",
      "Real-time updates",
      "Exclusive content",
      "Attendance tracking",
    ],
    color: "primary",
  },
  {
    icon: GraduationCap,
    title: "Education",
    description:
      "Course materials, campus navigation, and student resources for enhanced learning.",
    examples: ["Library resources", "Campus maps", "Assignment submission"],
    benefits: [
      "Easy resource access",
      "Campus navigation",
      "Student engagement",
      "Paperless submissions",
    ],
    color: "accent",
  },
];

const colorClasses = {
  primary: "bg-primary/10 text-primary border-primary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
};

export default function Solutions() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-4xl mx-auto"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
                Solutions
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                QR Solutions for{" "}
                <span className="gradient-text">Every Industry</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                From small businesses to enterprises, discover how organizations use
                IEOSUIA QR codes to connect with their audience and streamline operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Solutions Grid */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8">
              {solutions.map((solution, index) => (
                <motion.div
                  key={solution.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="h-full p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                    <div className="flex items-start gap-6">
                      <div
                        className={`w-16 h-16 rounded-2xl ${
                          colorClasses[solution.color as keyof typeof colorClasses]
                        } border flex items-center justify-center flex-shrink-0`}
                      >
                        <solution.icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-2xl font-bold mb-3">
                          {solution.title}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {solution.description}
                        </p>
                        
                        {/* Benefits */}
                        <div className="grid sm:grid-cols-2 gap-2 mb-4">
                          {solution.benefits.map((benefit) => (
                            <div key={benefit} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Examples */}
                        <div className="flex flex-wrap gap-2">
                          {solution.examples.map((example) => (
                            <span
                              key={example}
                              className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground"
                            >
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of businesses using IEOSUIA QR to connect with their customers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="gap-2">
                    Start Free Today
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/#pricing">
                  <Button size="lg" variant="outline">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
