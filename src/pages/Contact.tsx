import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  MessageSquare,
  Clock,
  Building2,
  HelpCircle,
  Headphones,
  Briefcase,
  Shield,
} from "lucide-react";

type InquiryPurpose = "general" | "support" | "sales";

const purposeConfig: Record<InquiryPurpose, { 
  label: string; 
  email: string; 
  icon: React.ElementType;
  description: string;
}> = {
  general: {
    label: "General / Friendly Inquiry",
    email: "hello@ieosuia.com",
    icon: HelpCircle,
    description: "General questions and inquiries",
  },
  support: {
    label: "Support / Technical Help",
    email: "support@ieosuia.com",
    icon: Headphones,
    description: "Get help with technical issues",
  },
  sales: {
    label: "Sales / Quotes / Partnerships",
    email: "sales@ieosuia.com",
    icon: Briefcase,
    description: "Pricing, quotes, and business inquiries",
  },
};

export default function Contact() {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [purpose, setPurpose] = useState<InquiryPurpose>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { executeRecaptcha, isLoaded: recaptchaLoaded } = useRecaptcha();

  // Handle preselected purpose from URL parameter
  useEffect(() => {
    const purposeParam = searchParams.get("purpose");
    if (purposeParam && purposeParam in purposeConfig) {
      setPurpose(purposeParam as InquiryPurpose);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get reCAPTCHA token
      const captchaToken = await executeRecaptcha("contact");
      
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          company, 
          message,
          purpose,
          purposeLabel: purposeConfig[purpose].label,
          targetEmail: purposeConfig[purpose].email,
          originUrl: window.location.href,
          source: "IEOSUIA QR - Contact Form",
          captcha_token: captchaToken,
        }),
      });

      if (response.ok) {
        toast({
          title: "Message sent!",
          description: `We'll get back to you within 24 hours at ${email}.`,
        });
        setName("");
        setEmail("");
        setCompany("");
        setMessage("");
        setPurpose("general");
      } else {
        throw new Error("Failed to send message");
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Failed to send",
        description: "Please try again or contact us via WhatsApp.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 lg:py-24 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.1),transparent_50%)]" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Contact Us
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Let's Talk About Your{" "}
                <span className="gradient-text">QR Needs</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Whether you need a custom enterprise solution or have questions about our plans,
                we're here to help.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="p-8 rounded-3xl bg-card border border-border">
                  <h2 className="font-display text-2xl font-bold mb-6">
                    Send us a message
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          required
                          maxLength={255}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company (optional)</Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Your company name"
                        maxLength={100}
                      />
                    </div>
                    
                    {/* Purpose of Inquiry */}
                    <div className="space-y-2">
                      <Label htmlFor="purpose">Purpose of Inquiry *</Label>
                      <Select value={purpose} onValueChange={(val) => setPurpose(val as InquiryPurpose)}>
                        <SelectTrigger id="purpose" className="w-full">
                          <SelectValue placeholder="Select the purpose of your inquiry" />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                          {Object.entries(purposeConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="w-4 h-4 text-muted-foreground" />
                                <span>{config.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Your message will be routed to: {purposeConfig[purpose].email}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us about your QR code needs..."
                        rows={5}
                        required
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {message.length}/2000
                      </p>
                    </div>
                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </motion.div>

              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="p-8 rounded-3xl bg-card border border-border">
                  <h2 className="font-display text-2xl font-bold mb-6">
                    Contact Information
                  </h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">Email</p>
                        <p className="text-muted-foreground text-sm mb-1">
                          hello@ieosuia.com <span className="text-xs">(General)</span>
                        </p>
                        <p className="text-muted-foreground text-sm mb-1">
                          support@ieosuia.com <span className="text-xs">(Support)</span>
                        </p>
                        <p className="text-muted-foreground text-sm">
                          sales@ieosuia.com <span className="text-xs">(Sales)</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">Phone & WhatsApp</p>
                        <a href="tel:+27799282775" className="text-muted-foreground hover:text-primary transition-colors text-sm block">
                          079 928 2775 (Calls & WhatsApp)
                        </a>
                        <a href="tel:+27631540696" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                          063 154 0696 (Calls Only)
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">Location</p>
                        <p className="text-muted-foreground text-sm">
                          26 Rock Alder, Extension 15,<br />
                          Naturena, Johannesburg, 2095
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                  <h3 className="font-display text-xl font-bold mb-4">
                    Enterprise Solutions
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Need a custom solution for your organization? Our enterprise team can help
                    with bulk QR codes, API access, and dedicated support.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span>Custom branding & white-label options</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span>Dedicated account manager</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>24/7 priority support</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Looking for pricing information?
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/#pricing">View Pricing Plans</Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
