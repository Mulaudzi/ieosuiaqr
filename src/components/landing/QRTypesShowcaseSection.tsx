import { motion } from "framer-motion";
import { 
  Link2, 
  MessageSquare, 
  Mail, 
  Phone, 
  MessageCircle,
  Wifi, 
  FileText, 
  Smartphone, 
  User,
  Video,
  Share2,
  Calendar,
  Barcode,
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const qrTypes = [
  { id: "url", name: "Link", icon: Link2, description: "Website URLs", color: "primary" },
  { id: "text", name: "Text", icon: MessageSquare, description: "Plain text", color: "accent" },
  { id: "email", name: "E-mail", icon: Mail, description: "Email addresses", color: "success" },
  { id: "phone", name: "Call", icon: Phone, description: "Phone numbers", color: "warning" },
  { id: "sms", name: "SMS", icon: MessageCircle, description: "Text messages", color: "primary" },
  { id: "vcard", name: "V-card", icon: User, description: "Contact cards", color: "accent" },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, description: "WhatsApp chat", color: "success" },
  { id: "wifi", name: "WI-FI", icon: Wifi, description: "WiFi credentials", color: "warning" },
  { id: "pdf", name: "PDF", icon: FileText, description: "PDF documents", color: "primary" },
  { id: "app", name: "App", icon: Smartphone, description: "App store links", color: "accent" },
  { id: "images", name: "Images", icon: Image, description: "Photo galleries", color: "success" },
  { id: "video", name: "Video", icon: Video, description: "Video content", color: "warning" },
  { id: "social", name: "Social Media", icon: Share2, description: "Social profiles", color: "primary" },
  { id: "event", name: "Event", icon: Calendar, description: "Calendar events", color: "accent" },
  { id: "barcode", name: "2D Barcode", icon: Barcode, description: "Product codes", color: "success" },
];

const colorClasses = {
  primary: "bg-primary/10 text-primary border-primary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
};

export function QRTypesShowcaseSection() {
  return (
    <section className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-muted/30" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            QR Code Types
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Every QR Type You{" "}
            <span className="gradient-text-accent">Need</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create QR codes for any purpose — from simple links to complex contact cards
          </p>
        </motion.div>

        {/* Types Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-5 gap-3 max-w-4xl mx-auto mb-12"
        >
          {qrTypes.map((type, index) => {
            const colors = colorClasses[type.color as keyof typeof colorClasses];
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border ${colors} hover:scale-105 transition-transform cursor-default`}
              >
                <type.icon className="w-6 h-6 mb-2" />
                <span className="text-xs font-medium text-center">{type.name}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <Button size="lg" variant="hero" asChild>
            <Link to="/create">
              Create Your QR Code
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
