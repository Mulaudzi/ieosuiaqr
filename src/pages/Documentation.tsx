import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  QrCode, 
  Package, 
  BarChart3, 
  Settings, 
  Users, 
  Bell,
  Download,
  Palette,
  Smartphone,
  ChevronRight,
  BookOpen,
  Video,
  FileText
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const documentationSections = [
  {
    title: "Getting Started",
    icon: BookOpen,
    description: "Learn the basics of IEOSUIA QR",
    articles: [
      { title: "Creating Your First QR Code", href: "#create-qr" },
      { title: "Understanding QR Code Types", href: "#qr-types" },
      { title: "Account Setup & Preferences", href: "#account-setup" },
      { title: "Dashboard Overview", href: "#dashboard" },
    ]
  },
  {
    title: "QR Code Management",
    icon: QrCode,
    description: "Create and manage dynamic QR codes",
    articles: [
      { title: "Static vs Dynamic QR Codes", href: "#static-dynamic" },
      { title: "Customizing QR Code Design", href: "#customize" },
      { title: "Adding Logos to QR Codes", href: "#logos" },
      { title: "Bulk QR Code Generation", href: "#bulk" },
      { title: "Downloading & Exporting", href: "#export" },
    ]
  },
  {
    title: "Inventory Management",
    icon: Package,
    description: "Track assets and inventory with QR codes",
    articles: [
      { title: "Setting Up Inventory Items", href: "#inventory-setup" },
      { title: "Linking QR Codes to Items", href: "#link-qr" },
      { title: "Status Tracking & History", href: "#status-tracking" },
      { title: "Bulk Import via CSV", href: "#csv-import" },
      { title: "Printing QR Labels", href: "#print-labels" },
    ]
  },
  {
    title: "Analytics & Reporting",
    icon: BarChart3,
    description: "Understand your scan data",
    articles: [
      { title: "Reading Scan Analytics", href: "#scan-analytics" },
      { title: "Geographic Data & Heatmaps", href: "#geo-data" },
      { title: "Device & Browser Reports", href: "#device-reports" },
      { title: "Exporting Reports (CSV/PDF)", href: "#export-reports" },
      { title: "Inventory Analytics Dashboard", href: "#inventory-analytics" },
    ]
  },
  {
    title: "Alerts & Notifications",
    icon: Bell,
    description: "Stay informed about your QR codes",
    articles: [
      { title: "Setting Up Email Alerts", href: "#email-alerts" },
      { title: "Maintenance Reminders", href: "#maintenance" },
      { title: "Low Activity Warnings", href: "#low-activity" },
      { title: "Status Change Notifications", href: "#status-notifications" },
    ]
  },
  {
    title: "Account & Settings",
    icon: Settings,
    description: "Manage your account preferences",
    articles: [
      { title: "Profile Settings", href: "#profile" },
      { title: "Billing & Subscriptions", href: "#billing" },
      { title: "Security Settings", href: "#security" },
      { title: "Notification Preferences", href: "#notification-prefs" },
    ]
  },
];

const quickLinks = [
  { title: "Video Tutorials", description: "Watch step-by-step guides", icon: Video, href: "https://www.youtube.com/@JohannesMilke", external: true },
  { title: "Support Center", description: "Get help from our team", icon: Users, href: "/support" },
  { title: "Contact Us", description: "Reach out directly", icon: FileText, href: "/contact" },
];

const Documentation = () => {
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
                Documentation
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Everything you need to know about using IEOSUIA QR. From creating your first QR code to advanced inventory management.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {quickLinks.map((link, index) => (
                <motion.div
                  key={link.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="text-center">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <link.icon className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{link.title}</CardTitle>
                          <CardDescription>{link.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </a>
                  ) : (
                    <Link to={link.href}>
                      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="text-center">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <link.icon className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{link.title}</CardTitle>
                          <CardDescription>{link.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {documentationSections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {section.articles.map((article) => (
                          <li key={article.title}>
                            <a 
                              href={article.href}
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                            >
                              <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                              {article.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Getting Started Guide */}
        <section className="py-16 bg-card/50" id="create-qr">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Quick Start Guide</h2>
              
              <div className="grid gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">1</div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Create Your Account</h3>
                        <p className="text-muted-foreground">
                          Sign up for free at IEOSUIA QR. You can start with our Free plan which includes 5 QR codes and basic features.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">2</div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Choose Your QR Type</h3>
                        <p className="text-muted-foreground">
                          Select from URL, vCard, WiFi, Event, Location, or Text QR codes. Each type serves a different purpose.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">3</div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Customize Your Design</h3>
                        <p className="text-muted-foreground">
                          Add your brand colors, upload a logo, and adjust the style to match your branding.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">4</div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Download & Deploy</h3>
                        <p className="text-muted-foreground">
                          Download your QR code in PNG, SVG, or PDF format. Print it, share it digitally, or embed it on your website.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">5</div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Track & Analyze</h3>
                        <p className="text-muted-foreground">
                          Monitor scans, view analytics, and update your dynamic QR codes anytime without reprinting.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center mt-8">
                <Button variant="hero" size="lg" asChild>
                  <Link to="/signup">
                    Get Started Free
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Need Help CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Need More Help?</h2>
              <p className="text-muted-foreground mb-8">
                Can't find what you're looking for? Our support team is ready to assist you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg">
                  <Link to="/support">Visit Support Center</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/contact">Contact Us</Link>
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

export default Documentation;
