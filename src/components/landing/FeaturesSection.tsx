import { motion } from "framer-motion";
import {
  QrCode,
  BarChart3,
  Palette,
  Zap,
  Shield,
  Users,
  Globe,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Multiple QR Types",
    description:
      "Create URL, vCard, WiFi, Email, SMS, Event, and Geo-location QR codes with ease.",
    color: "primary",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Track scans, locations, devices, and more with real-time dashboards and reports.",
    color: "accent",
  },
  {
    icon: Palette,
    title: "Custom Branding",
    description:
      "Add your logo, choose colors, and customize patterns to match your brand identity.",
    color: "success",
  },
  {
    icon: Zap,
    title: "Dynamic QR Codes",
    description:
      "Update content anytime without reprinting. Perfect for campaigns and promotions.",
    color: "warning",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "GDPR compliant with encrypted data, role-based access, and audit logs.",
    color: "primary",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite team members, assign roles, and manage QR codes together seamlessly.",
    color: "accent",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description:
      "QR codes work worldwide with multi-language support and international tracking.",
    color: "success",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description:
      "Generate and manage QR codes on any device with our responsive platform.",
    color: "warning",
  },
];

const colorClasses = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
  },
  accent: {
    bg: "bg-accent/10",
    text: "text-accent",
    border: "border-accent/20",
  },
  success: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/20",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20",
  },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-muted/30" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From creation to analytics, we provide all the tools you need to
            create impactful QR code campaigns.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color as keyof typeof colorClasses];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  <div
                    className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
