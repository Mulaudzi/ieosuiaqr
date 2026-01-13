import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Shield, Zap, Clock } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.1),transparent_70%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Start for free, upgrade anytime
            </span>
          </motion.div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
            Start Tracking Your First Items{" "}
            <span className="gradient-text">Free</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join businesses, churches, and schools using IEOSUIA to create smart QR codes and track inventory. No hardware or credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/signup">
                Create QR Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">Talk to Sales</Link>
            </Button>
          </div>

          {/* Value Props instead of fake stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Instant Setup</p>
              <p className="text-xs text-muted-foreground mt-1">Ready in minutes</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-foreground">POPIA Compliant</p>
              <p className="text-xs text-muted-foreground mt-1">Your data is safe</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-success" />
              </div>
              <p className="text-sm font-medium text-foreground">SA Based Support</p>
              <p className="text-xs text-muted-foreground mt-1">Local expertise</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
