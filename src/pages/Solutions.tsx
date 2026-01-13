import { useState, useMemo } from "react";
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
  Church,
  Truck,
  Stethoscope,
  Factory,
  Hotel,
  Wrench,
  Users,
  Dumbbell,
  Briefcase,
  Search,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const solutions = [
  {
    id: "inventory-asset-tracking",
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
    category: "Operations",
  },
  {
    id: "retail-ecommerce",
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
    category: "Sales",
  },
  {
    id: "restaurants-cafes",
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
    category: "Hospitality",
  },
  {
    id: "real-estate",
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
    category: "Sales",
  },
  {
    id: "events-entertainment",
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
    category: "Events",
  },
  {
    id: "education",
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
    category: "Education",
  },
  {
    id: "churches-religious",
    icon: Church,
    title: "Churches & Religious Organizations",
    description:
      "Streamline church operations with QR codes for equipment tracking, event registration, and resource sharing.",
    examples: ["Sound equipment", "Sermon notes", "Donation links", "Event registration"],
    benefits: [
      "Equipment accountability",
      "Easy member engagement",
      "Simplified check-ins",
      "Resource distribution",
    ],
    color: "success",
    category: "Non-Profit",
  },
  {
    id: "healthcare-medical",
    icon: Stethoscope,
    title: "Healthcare & Medical",
    description:
      "Patient information, appointment scheduling, and medical equipment tracking for clinics and hospitals.",
    examples: ["Patient forms", "Equipment tracking", "Appointment links", "Medical records"],
    benefits: [
      "Paperless intake",
      "Equipment maintenance logs",
      "Quick patient access",
      "Compliance tracking",
    ],
    color: "warning",
    category: "Healthcare",
  },
  {
    id: "logistics-warehousing",
    icon: Truck,
    title: "Logistics & Warehousing",
    description:
      "Track shipments, manage warehouse inventory, and streamline supply chain operations.",
    examples: ["Pallet tracking", "Shipment labels", "Warehouse bins", "Delivery confirmation"],
    benefits: [
      "Real-time tracking",
      "Reduced errors",
      "Faster picking",
      "Complete audit trails",
    ],
    color: "primary",
    category: "Operations",
  },
  {
    id: "manufacturing",
    icon: Factory,
    title: "Manufacturing",
    description:
      "Production line tracking, quality control, and equipment maintenance for factories.",
    examples: ["Work orders", "Quality checks", "Machine maintenance", "Parts tracking"],
    benefits: [
      "Production monitoring",
      "Quality assurance",
      "Maintenance alerts",
      "Traceability",
    ],
    color: "accent",
    category: "Operations",
  },
  {
    id: "hospitality-tourism",
    icon: Hotel,
    title: "Hospitality & Tourism",
    description:
      "Enhance guest experiences with digital concierge, room service, and local guides.",
    examples: ["Room info", "Wi-Fi access", "Local attractions", "Feedback forms"],
    benefits: [
      "Contactless services",
      "Guest engagement",
      "Easy updates",
      "Review collection",
    ],
    color: "success",
    category: "Hospitality",
  },
  {
    id: "maintenance-repairs",
    icon: Wrench,
    title: "Maintenance & Repairs",
    description:
      "Track service history, schedule maintenance, and manage work orders for equipment and facilities.",
    examples: ["Service logs", "Work orders", "Equipment manuals", "Spare parts"],
    benefits: [
      "Complete history",
      "Preventive alerts",
      "Quick access to manuals",
      "Parts ordering",
    ],
    color: "warning",
    category: "Operations",
  },
  {
    id: "non-profits-ngos",
    icon: Users,
    title: "Non-Profits & NGOs",
    description:
      "Donation links, volunteer coordination, and resource distribution for charitable organizations.",
    examples: ["Donation QR", "Volunteer signup", "Event materials", "Impact reports"],
    benefits: [
      "Easy donations",
      "Volunteer management",
      "Resource tracking",
      "Transparency",
    ],
    color: "primary",
    category: "Non-Profit",
  },
  {
    id: "fitness-gyms",
    icon: Dumbbell,
    title: "Fitness & Gyms",
    description:
      "Equipment instructions, class schedules, and membership management for fitness centers.",
    examples: ["Equipment guides", "Class schedules", "Membership cards", "Trainer contacts"],
    benefits: [
      "Self-service info",
      "Easy scheduling",
      "Member engagement",
      "Equipment tracking",
    ],
    color: "accent",
    category: "Hospitality",
  },
  {
    id: "professional-services",
    icon: Briefcase,
    title: "Professional Services",
    description:
      "Digital business cards, document sharing, and client engagement for consultants and agencies.",
    examples: ["vCard sharing", "Portfolio links", "Meeting scheduling", "Document access"],
    benefits: [
      "Professional image",
      "Easy contact sharing",
      "Lead capture",
      "Document distribution",
    ],
    color: "success",
    category: "Sales",
  },
];

const colorClasses = {
  primary: "bg-primary/10 text-primary border-primary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
};

const categories = ["All", "Operations", "Sales", "Hospitality", "Education", "Healthcare", "Events", "Non-Profit"];

export default function Solutions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredSolutions = useMemo(() => {
    return solutions.filter((solution) => {
      const matchesSearch = 
        solution.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        solution.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        solution.examples.some(ex => ex.toLowerCase().includes(searchQuery.toLowerCase())) ||
        solution.benefits.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === "All" || solution.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

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
                <Link to="/contact?purpose=sales">
                  <Button size="lg" variant="outline">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="py-8 border-b border-border bg-card/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for your industry, use case, or feature..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-12 py-6 text-lg rounded-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2 justify-center">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className={`cursor-pointer transition-all px-4 py-2 text-sm ${
                      selectedCategory === category 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-primary/10"
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>

              {/* Results Count */}
              <p className="text-center text-sm text-muted-foreground">
                Showing {filteredSolutions.length} of {solutions.length} solutions
              </p>
            </div>
          </div>
        </section>

        {/* Solutions Grid */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            {filteredSolutions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No solutions found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>
                  Clear Filters
                </Button>
              </motion.div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                {filteredSolutions.map((solution, index) => (
                  <motion.div
                    key={solution.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                  <Link to={`/solutions/${solution.id}`} className="block h-full">
                    <div className="h-full p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 group">
                      <div className="flex items-start gap-6">
                        <div
                          className={`w-16 h-16 rounded-2xl ${
                            colorClasses[solution.color as keyof typeof colorClasses]
                          } border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                        >
                          <solution.icon className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {solution.category}
                            </Badge>
                          </div>
                          <h3 className="font-display text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
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
                          <div className="flex flex-wrap gap-2 mb-4">
                            {solution.examples.map((example) => (
                              <span
                                key={example}
                                className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground"
                              >
                                {example}
                              </span>
                            ))}
                          </div>

                          {/* Learn More Link */}
                          <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                            Learn More
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  </motion.div>
                ))}
              </div>
            )}
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
