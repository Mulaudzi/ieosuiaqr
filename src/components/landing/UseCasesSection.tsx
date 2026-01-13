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
} from "lucide-react";
import { Button } from "@/components/ui/button";

const useCases = [
  {
    icon: Package,
    title: "Inventory & Asset Tracking",
    description:
      "Track equipment, products, and assets with smart QR codes. Perfect for churches, schools, warehouses, and events.",
    examples: ["Church equipment", "School books", "Shop stock", "Event check-in"],
    color: "primary",
  },
  {
    icon: Store,
    title: "Retail & E-commerce",
    description:
      "Link to product pages, promotions, and loyalty programs. Track customer engagement.",
    examples: ["Product packaging", "In-store displays", "Receipt marketing"],
    color: "accent",
  },
  {
    icon: Utensils,
    title: "Restaurants & Cafes",
    description:
      "Digital menus, contactless ordering, and customer feedback collection.",
    examples: ["Table menus", "Takeaway orders", "Review collection"],
    color: "success",
  },
  {
    icon: Building2,
    title: "Real Estate",
    description:
      "Virtual tours, property details, and agent contact information.",
    examples: ["Property signs", "Brochures", "Open house materials"],
    color: "warning",
  },
  {
    icon: Ticket,
    title: "Events & Entertainment",
    description:
      "Ticketing, event schedules, and exclusive content access.",
    examples: ["Event tickets", "Venue navigation", "VIP experiences"],
    color: "primary",
  },
  {
    icon: GraduationCap,
    title: "Education",
    description:
      "Course materials, campus navigation, and student resources.",
    examples: ["Library resources", "Campus maps", "Assignment submission"],
    color: "accent",
  },
];

const colorClasses = {
  primary: "bg-primary/10 text-primary border-primary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
};

export function UseCasesSection() {
  return (
    <section id="solutions" className="py-24 lg:py-32 relative bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
            Solutions
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Built for{" "}
            <span className="gradient-text">Every Industry</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From small businesses to enterprises, see how organizations use
            IEOSUIA QR codes to connect with their audience.
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <div
                  className={`w-14 h-14 rounded-2xl ${
                    colorClasses[useCase.color as keyof typeof colorClasses]
                  } border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <useCase.icon className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">
                  {useCase.title}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {useCase.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {useCase.examples.map((example) => (
                    <span
                      key={example}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Solutions Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link to="/solutions">
            <Button size="lg" variant="outline" className="gap-2">
              View All Solutions
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
