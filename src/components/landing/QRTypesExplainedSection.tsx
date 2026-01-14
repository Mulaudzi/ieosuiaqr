import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Lock, RefreshCw, PieChart } from "lucide-react";

export function QRTypesExplainedSection() {
  return (
    <section className="py-24 lg:py-32 relative bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Understanding QR Codes
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Dynamic vs Static{" "}
            <span className="gradient-text">QR Codes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the right QR code type for your needs
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Dynamic QR Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl bg-card border border-border p-8 hover:shadow-lg transition-shadow"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold mb-6">
              DYNAMIC
            </span>

            {/* Illustration */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-10 h-10 text-primary" />
              </div>
              <div className="w-16 h-16 rounded-xl bg-success/10 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-success" />
              </div>
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                <PieChart className="w-7 h-7 text-accent" />
              </div>
            </div>

            <h3 className="font-display text-xl font-bold mb-4">
              Dynamic QR Codes Explained
            </h3>
            
            <div className="space-y-3 text-muted-foreground">
              <p className="flex items-start gap-2">
                <RefreshCw className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Update the destination URL anytime without reprinting the QR code.</span>
              </p>
              <p className="flex items-start gap-2">
                <BarChart3 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Track scans in real-time: see who scanned, when, and where.</span>
              </p>
              <p className="mt-4 font-medium text-foreground">
                Perfect for marketing campaigns, business cards, product packaging, and any use case where tracking or updates matter.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Real-time Analytics</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Editable Content</span>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">A/B Testing</span>
              </div>
            </div>
          </motion.div>

          {/* Static QR Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-3xl bg-card border border-border p-8 hover:shadow-lg transition-shadow"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-muted-foreground text-muted text-xs font-semibold mb-6">
              STATIC
            </span>

            {/* Illustration */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-0.5 w-14 h-14">
                    {[...Array(25)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-full aspect-square rounded-sm ${
                          Math.random() > 0.5 ? 'bg-foreground' : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-md">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>

            <h3 className="font-display text-xl font-bold mb-4">
              Static QR Codes Explained
            </h3>
            
            <div className="space-y-3 text-muted-foreground">
              <p>
                Static QR Codes encode information directly in the QR pattern itself.
              </p>
              <p>
                Once generated, the content cannot be changed—it's permanently embedded in the design.
              </p>
              <p className="mt-4 font-medium text-foreground">
                Perfect for simple use cases like sharing WiFi passwords, contact information, or plain text that never changes.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">No Tracking</span>
                <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">Fixed Content</span>
                <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">Free Forever</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
