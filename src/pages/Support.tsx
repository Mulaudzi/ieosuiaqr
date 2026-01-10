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
  CheckCircle2
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
    articles: 12,
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
];

const faqs = [
  {
    question: "How do I create my first QR code?",
    answer: "After signing up, navigate to your Dashboard and click 'Create QR Code'. Choose your QR type (URL, vCard, WiFi, etc.), enter your content, customize the design, and click 'Generate'. Your QR code is ready to download and use!"
  },
  {
    question: "What's the difference between static and dynamic QR codes?",
    answer: "Static QR codes contain fixed information that cannot be changed once created. Dynamic QR codes use a short URL that redirects to your destination, allowing you to update the target URL anytime without reprinting the QR code. Dynamic codes also provide scan analytics."
  },
  {
    question: "Can I track how many times my QR code is scanned?",
    answer: "Yes! Dynamic QR codes include full analytics. You can see total scans, unique visitors, location data, device types, and scan times. Access your analytics from the Dashboard by clicking on any QR code."
  },
  {
    question: "How do I upgrade or downgrade my plan?",
    answer: "Go to Dashboard → Settings → Billing. Click 'Change Plan' to see available options. When upgrading, you'll be charged the prorated difference. When downgrading, changes take effect at your next billing cycle."
  },
  {
    question: "Can I use my QR codes commercially?",
    answer: "Absolutely! All QR codes created with IEOSUIA QR can be used for personal and commercial purposes. You retain full ownership of your QR codes and the content they link to."
  },
  {
    question: "What file formats can I download my QR code in?",
    answer: "We offer PNG, SVG, and PDF formats. PNG is best for digital use, SVG for scalable graphics and large prints, and PDF for professional printing with precise sizing."
  },
  {
    question: "How do I reset my password?",
    answer: "Click 'Forgot Password' on the login page, enter your email address, and we'll send you a reset link. The link expires after 1 hour for security. If you don't receive it, check your spam folder."
  },
  {
    question: "Is there an API available?",
    answer: "Yes! Our Enterprise plan includes full API access for programmatic QR code generation and management. Check our API documentation for integration guides and endpoints."
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
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Live Chat</CardTitle>
                    <CardDescription>Chat with our team</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground text-sm">Available for Pro & Enterprise</p>
                    <div className="flex items-center justify-center gap-2 mt-3 text-sm text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Online now</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Book className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Documentation</CardTitle>
                    <CardDescription>Browse our guides</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground text-sm">Detailed tutorials and API docs</p>
                    <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
                      <FileQuestion className="h-4 w-4" />
                      <span>50+ articles</span>
                    </div>
                  </CardContent>
                </Card>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
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
              className="max-w-3xl mx-auto"
            >
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
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
                  <Link to="/dashboard">
                    Go to Dashboard
                  </Link>
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
