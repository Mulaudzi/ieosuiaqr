import { motion } from "framer-motion";
import { 
  Square, 
  Circle, 
  Star, 
  Diamond, 
  Plus,
  Hexagon,
  Palette,
  Frame,
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const shapeStyles = [
  { name: "Classic", style: "rounded-none" },
  { name: "Rounded", style: "rounded-md" },
  { name: "Dots", style: "rounded-full" },
  { name: "Diamond", style: "rotate-45" },
];

const borderStyles = [
  { name: "Square", icon: Square },
  { name: "Rounded", icon: Square, rounded: true },
  { name: "Circle", icon: Circle },
  { name: "Hexagon", icon: Hexagon },
];

const centerStyles = [
  { name: "Square", icon: Square },
  { name: "Rounded", icon: Square, rounded: true },
  { name: "Circle", icon: Circle },
  { name: "Star", icon: Star },
  { name: "Diamond", icon: Diamond },
  { name: "Plus", icon: Plus },
];

const frames = [
  { name: "Simple", hasText: false, color: "bg-primary" },
  { name: "Scan Me", hasText: true, text: "SCAN ME", color: "bg-primary" },
  { name: "Bold", hasText: true, text: "SCAN HERE", color: "bg-foreground" },
  { name: "Elegant", hasText: true, text: "Discover More", color: "bg-accent" },
];

export function QRDesignShowcaseSection() {
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
            Customization
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Design Your QR Code{" "}
            <span className="gradient-text">Your Way</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Customize every aspect of your QR code to match your brand identity
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Shape Styles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-card border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg">Shape Styles</h3>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {shapeStyles.map((shape) => (
                <div
                  key={shape.name}
                  className="aspect-square rounded-xl bg-muted/50 border border-border p-3 flex items-center justify-center hover:border-primary/50 transition-colors"
                >
                  <div className="grid grid-cols-3 gap-1 w-full h-full">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className={`bg-foreground ${shape.style}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              8 different pattern styles to choose from
            </p>
          </motion.div>

          {/* Border Styles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl bg-card border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Frame className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-lg">Corner Styles</h3>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {borderStyles.map((border) => (
                <div
                  key={border.name}
                  className={`aspect-square rounded-xl bg-primary/10 border-2 border-primary flex items-center justify-center hover:bg-primary/20 transition-colors ${
                    border.rounded ? 'rounded-xl' : ''
                  }`}
                >
                  <border.icon className={`w-6 h-6 text-primary ${border.rounded ? 'rounded' : ''}`} />
                </div>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Customize corner finder patterns
            </p>
          </motion.div>

          {/* Center Styles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl bg-card border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Image className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-display font-semibold text-lg">Center Icons</h3>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {centerStyles.slice(0, 4).map((center) => (
                <div
                  key={center.name}
                  className="aspect-square rounded-xl bg-foreground flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <center.icon className="w-5 h-5 text-background" />
                </div>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Add unique center elements or your logo
            </p>
          </motion.div>

          {/* Frames */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl bg-card border border-border p-6 md:col-span-2 lg:col-span-3"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Frame className="w-5 h-5 text-warning" />
              </div>
              <h3 className="font-display font-semibold text-lg">QR Code Frames</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {frames.map((frame) => (
                <div
                  key={frame.name}
                  className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className={`${frame.color} rounded-lg p-3 mb-2`}>
                    <div className="aspect-square bg-white rounded-md flex items-center justify-center">
                      <div className="grid grid-cols-5 gap-0.5 w-10 h-10">
                        {[...Array(25)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-full aspect-square ${
                              Math.random() > 0.4 ? 'bg-foreground' : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {frame.hasText && (
                      <p className="text-center text-white text-xs font-semibold mt-2">
                        {frame.text}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-medium text-center">{frame.name}</p>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Add eye-catching frames with call-to-action text to boost engagement
            </p>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Button size="lg" variant="hero" asChild>
            <Link to="/create">
              Start Designing
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
