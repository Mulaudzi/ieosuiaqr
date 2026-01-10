import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Cookie } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <Cookie className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Cookie Policy</h1>
          </div>
          <p className="text-muted-foreground mb-8">Last updated: January 10, 2025</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your computer or mobile device when you 
                visit a website. They are widely used to make websites work more efficiently and provide 
                information to the owners of the site. Cookies help us enhance your experience on IEOSUIA QR 
                by remembering your preferences and understanding how you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Types of Cookies We Use</h2>
              
              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <h3 className="text-xl font-medium text-primary mb-3">Essential Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  These cookies are necessary for the website to function properly. They enable core 
                  functionality such as security, network management, and account access.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-foreground">Cookie Name</th>
                        <th className="text-left py-2 text-foreground">Purpose</th>
                        <th className="text-left py-2 text-foreground">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono text-xs">auth_token</td>
                        <td className="py-2">User authentication and session management</td>
                        <td className="py-2">Session / 30 days</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono text-xs">csrf_token</td>
                        <td className="py-2">Security - prevents cross-site request forgery</td>
                        <td className="py-2">Session</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-xs">cookie_consent</td>
                        <td className="py-2">Stores your cookie preferences</td>
                        <td className="py-2">1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <h3 className="text-xl font-medium text-primary mb-3">Functional Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  These cookies enable enhanced functionality and personalization, such as remembering 
                  your preferences and settings.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-foreground">Cookie Name</th>
                        <th className="text-left py-2 text-foreground">Purpose</th>
                        <th className="text-left py-2 text-foreground">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono text-xs">theme</td>
                        <td className="py-2">Remembers your preferred color theme</td>
                        <td className="py-2">1 year</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono text-xs">language</td>
                        <td className="py-2">Stores your language preference</td>
                        <td className="py-2">1 year</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-xs">dashboard_view</td>
                        <td className="py-2">Remembers your dashboard layout preferences</td>
                        <td className="py-2">1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <h3 className="text-xl font-medium text-primary mb-3">Analytics Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  These cookies help us understand how visitors interact with our website by collecting 
                  and reporting information anonymously.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-foreground">Cookie Name</th>
                        <th className="text-left py-2 text-foreground">Purpose</th>
                        <th className="text-left py-2 text-foreground">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono text-xs">_ga</td>
                        <td className="py-2">Google Analytics - distinguishes unique users</td>
                        <td className="py-2">2 years</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono text-xs">_gid</td>
                        <td className="py-2">Google Analytics - distinguishes users</td>
                        <td className="py-2">24 hours</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-xs">_gat</td>
                        <td className="py-2">Google Analytics - throttles request rate</td>
                        <td className="py-2">1 minute</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-medium text-primary mb-3">Marketing Cookies</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  These cookies are used to track visitors across websites to display relevant 
                  advertisements. We currently do not use marketing cookies, but may in the future 
                  with your consent.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Some cookies are placed by third-party services that appear on our pages. We use the 
                following third-party services that may set cookies:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li><strong className="text-foreground">Google Analytics:</strong> For website traffic analysis</li>
                <li><strong className="text-foreground">Google reCAPTCHA:</strong> For spam protection and security</li>
                <li><strong className="text-foreground">PayFast:</strong> For payment processing (only during checkout)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. QR Code Scan Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                When someone scans a QR code created through IEOSUIA QR, we collect anonymous analytics 
                data. This is not done through cookies but through our scan tracking system. The data 
                collected includes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>Date and time of the scan</li>
                <li>Approximate location (city/country level from IP address)</li>
                <li>Device type and browser</li>
                <li>Referrer information</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                This data is provided to QR code owners to help them understand their audience. 
                No personal information is collected from QR code scanners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can control and manage cookies in several ways:
              </p>
              
              <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Browser Settings</h3>
              <p className="text-muted-foreground leading-relaxed">
                Most browsers allow you to refuse or accept cookies, delete existing cookies, and set 
                preferences for certain websites. Here's how to manage cookies in popular browsers:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li><strong className="text-foreground">Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                <li><strong className="text-foreground">Firefox:</strong> Settings → Privacy & Security → Cookies</li>
                <li><strong className="text-foreground">Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong className="text-foreground">Edge:</strong> Settings → Privacy & Security → Cookies</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Opt-Out Links</h3>
              <p className="text-muted-foreground leading-relaxed">
                You can opt out of specific third-party cookies:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>
                  <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google Analytics Opt-out
                  </a>
                </li>
                <li>
                  <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Google Ads Settings
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Impact of Disabling Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you choose to disable cookies, please note that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>You may not be able to log in to your account</li>
                <li>Your preferences and settings won't be remembered</li>
                <li>Some features of the Service may not function properly</li>
                <li>You may see the cookie consent banner repeatedly</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices 
                or for operational, legal, or regulatory reasons. We will notify you of any material 
                changes by posting the new Cookie Policy on this page with an updated "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className="mt-4 text-muted-foreground">
                <p><strong className="text-foreground">Email:</strong> support@ieosuia.com</p>
                <p className="mt-2"><strong className="text-foreground">Website:</strong> https://qr.ieosuia.com</p>
              </div>
            </section>

            <section className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Related Policies</h2>
              <div className="flex flex-wrap gap-4">
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                <Link to="/support" className="text-primary hover:underline">Support Center</Link>
              </div>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicy;
