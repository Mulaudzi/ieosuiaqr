import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Mail, 
  MessageCircle, 
  Book, 
  FileQuestion, 
  Zap, 
  Shield, 
  CreditCard, 
  QrCode,
  ChevronRight,
  Clock,
  CheckCircle2,
  Package,
  Bell,
  Settings
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const supportCategories = [
  {
    icon: QrCode,
    title: "QR Codes",
    description: "Creating, customizing, and managing QR codes",
    articles: 15,
  },
  {
    icon: Package,
    title: "Inventory",
    description: "Asset tracking and inventory management",
    articles: 10,
  },
  {
    icon: Zap,
    title: "Analytics",
    description: "Understanding your scan data and reports",
    articles: 8,
  },
  {
    icon: CreditCard,
    title: "Billing & Plans",
    description: "Subscriptions, payments, and invoices",
    articles: 10,
  },
  {
    icon: Shield,
    title: "Account & Security",
    description: "Account settings, password, and security",
    articles: 7,
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Alerts, reminders, and email settings",
    articles: 5,
  },
];

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I create my first QR code?",
        answer: "After signing up, navigate to your Dashboard and click 'Create QR Code'. Choose your QR type (URL, vCard, WiFi, etc.), enter your content, customize the design, and click 'Generate'. Your QR code is ready to download and use!"
      },
      {
        question: "What's the difference between static and dynamic QR codes?",
        answer: "Static QR codes contain fixed information that cannot be changed once created. Dynamic QR codes use a short URL that redirects to your destination, allowing you to update the target URL anytime without reprinting the QR code. Dynamic codes also provide scan analytics."
      },
      {
        question: "Do I need to install any software?",
        answer: "No! IEOSUIA QR is completely web-based. You can create, manage, and download QR codes from any modern web browser on your computer, tablet, or smartphone."
      },
      {
        question: "What QR code types are available?",
        answer: "We support URL, Text, vCard (contact cards), WiFi network sharing, Event/Calendar entries, and Location/Maps. Pro and Enterprise plans unlock all QR types including advanced options."
      },
    ]
  },
  {
    category: "QR Code Management",
    questions: [
      {
        question: "Can I track how many times my QR code is scanned?",
        answer: "Yes! Dynamic QR codes include full analytics. You can see total scans, unique visitors, location data, device types, and scan times. Access your analytics from the Dashboard by clicking on any QR code."
      },
      {
        question: "Can I edit a QR code after creating it?",
        answer: "For dynamic QR codes, yes! You can change the destination URL, update content, and modify settings anytime. Static QR codes cannot be edited after creation."
      },
      {
        question: "What file formats can I download my QR code in?",
        answer: "We offer PNG, SVG, and PDF formats. PNG is best for digital use, SVG for scalable graphics and large prints, and PDF for professional printing with precise sizing."
      },
      {
        question: "Can I add my logo to a QR code?",
        answer: "Yes! Pro and Enterprise plans allow you to embed your logo in the center of your QR code. The logo is automatically sized to ensure the QR code remains scannable."
      },
      {
        question: "How do I create multiple QR codes at once?",
        answer: "Use our Bulk CSV Import feature (Pro and Enterprise plans). Prepare a CSV file with your data, upload it, and we'll generate all your QR codes automatically."
      },
      {
        question: "Can I use my QR codes commercially?",
        answer: "Absolutely! All QR codes created with IEOSUIA QR can be used for personal and commercial purposes. You retain full ownership of your QR codes and the content they link to."
      },
    ]
  },
  {
    category: "Inventory & Tracking",
    questions: [
      {
        question: "What is the inventory feature?",
        answer: "Inventory management lets you track physical assets using QR codes. Create items, link them to QR codes, track their status (In Stock, In Use, Maintenance, etc.), and view complete history of status changes."
      },
      {
        question: "How do I import existing inventory?",
        answer: "Use our CSV import feature to bulk-add inventory items. Prepare a CSV with columns for name, description, category, and status, then upload it through the Inventory page."
      },
      {
        question: "Can I print QR labels for my inventory?",
        answer: "Yes! Select items from your inventory and use the 'Print Labels' feature to generate printable QR code labels with item names and details."
      },
      {
        question: "How does status tracking work?",
        answer: "When anyone scans an inventory item's QR code, they can update its status. All changes are logged with timestamps, allowing you to see the complete history of each item."
      },
    ]
  },
  {
    category: "Analytics",
    questions: [
      {
        question: "What analytics data is collected?",
        answer: "We track scan counts, unique visitors, geographic location (city/country), device types, browsers, operating systems, and scan times. All data is collected anonymously."
      },
      {
        question: "Can I export my analytics data?",
        answer: "Yes! Pro and Enterprise plans can export analytics as CSV or PDF reports. Go to Analytics or Inventory Analytics and click the export button."
      },
      {
        question: "How accurate is the location data?",
        answer: "Location data is based on IP geolocation and is typically accurate to the city level. We don't track exact GPS coordinates for privacy reasons."
      },
    ]
  },
  {
    category: "Billing & Subscriptions",
    questions: [
      {
        question: "How do I upgrade or downgrade my plan?",
        answer: "Go to Dashboard → Settings → Billing. Click 'Change Plan' to see available options. When upgrading, you'll be charged the prorated difference. When downgrading, changes take effect at your next billing cycle."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept payments through PayFast, which supports credit/debit cards, instant EFT, and other South African payment methods. All payments are processed securely."
      },
      {
        question: "Is there a free trial?",
        answer: "Yes! All paid plans come with a free trial period. Start your trial without a credit card and upgrade when you're ready."
      },
      {
        question: "How do I cancel my subscription?",
        answer: "Go to Dashboard → Settings → Billing and click 'Cancel Subscription'. Your access continues until the end of your current billing period."
      },
      {
        question: "Do you offer refunds?",
        answer: "We offer refunds within 14 days of purchase if you're not satisfied. Contact support@ieosuia.com with your request."
      },
    ]
  },
  {
    category: "Account & Security",
    questions: [
      {
        question: "How do I reset my password?",
        answer: "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a reset link. The link expires after 1 hour for security. If you don't receive it, check your spam folder."
      },
      {
        question: "Is my data secure?",
        answer: "Yes! We use industry-standard encryption for all data. Your QR codes, analytics, and personal information are protected. We never share your data with third parties."
      },
      {
        question: "Can I delete my account?",
        answer: "Yes. Contact support@ieosuia.com to request account deletion. We'll permanently delete all your data within 30 days."
      },
      {
        question: "Do you support two-factor authentication?",
        answer: "We're working on adding 2FA. Currently, we recommend using a strong, unique password and keeping your email account secure."
      },
    ]
  },
  {
    category: "Notifications & Alerts",
    questions: [
      {
        question: "How do I set up email notifications?",
        answer: "Go to Dashboard → Settings → Notifications. You can enable alerts for status changes, maintenance reminders, and low activity warnings."
      },
      {
        question: "What is the low activity alert?",
        answer: "This alert notifies you when an inventory item hasn't been scanned for a specified number of days (7-90 days, configurable). Useful for tracking items that may be lost or forgotten."
      },
      {
        question: "Can I set maintenance reminders?",
        answer: "Yes! Set a maintenance due date for any inventory item, and we'll send you an email reminder when it's approaching."
      },
    ]
  },
];

const Support = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center"
            >
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                How can we help you?
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Find answers, get support, and learn how to make the most of IEOSUIA QR.
              </p>
              
              {/* Search placeholder - visual only */}
              <div className="relative max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder="Search for help articles..."
                  className="w-full px-6 py-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button className="absolute right-2 top-1/2 -translate-y-1/2">
                  Search
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Email Support</CardTitle>
                    <CardDescription>Get help via email</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <a href="mailto:support@ieosuia.com" className="text-primary hover:underline">
                      support@ieosuia.com
                    </a>
                    <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Response within 24 hours</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <a href="https://wa.me/27799282775" target="_blank" rel="noopener noreferrer">
                  <Card className="h-full hover:border-success/50 transition-colors cursor-pointer">
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-3">
                        <MessageCircle className="h-6 w-6 text-success" />
                      </div>
                      <CardTitle className="text-lg">WhatsApp Support</CardTitle>
                      <CardDescription>Chat with us on WhatsApp</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-success text-sm font-medium">079 928 2775</p>
                      <div className="flex items-center justify-center gap-2 mt-3 text-sm text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Quick responses</span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Link to="/docs">
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Book className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Documentation</CardTitle>
                      <CardDescription>Browse our guides</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-muted-foreground text-sm">Detailed tutorials and guides</p>
                      <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
                        <FileQuestion className="h-4 w-4" />
                        <span>50+ articles</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Browse by Category</h2>
              <p className="text-muted-foreground">Find help articles organized by topic</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {supportCategories.map((category, index) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:border-primary/50 hover:bg-card/80 transition-all cursor-pointer group">
                    <CardHeader>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        <category.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {category.title}
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm text-muted-foreground">{category.articles} articles</span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-card/50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Quick answers to common questions</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              {faqs.map((faqCategory) => (
                <div key={faqCategory.category}>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    {faqCategory.category}
                  </h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {faqCategory.questions.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`${faqCategory.category}-${index}`}
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
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Still need help?</h2>
              <p className="text-muted-foreground mb-8">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg">
                  <a href="mailto:support@ieosuia.com">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="https://wa.me/27799282775" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp Us
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
