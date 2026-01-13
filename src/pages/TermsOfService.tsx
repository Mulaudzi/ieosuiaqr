import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Scale } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const TermsOfService = () => {
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

          <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 13, 2025</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using IEOSUIA QR ("Service"), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by these terms, please do not 
                use this Service. These terms are governed by the laws of the Republic of South Africa.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                IEOSUIA QR provides a platform for creating, managing, and tracking QR codes. Our services include:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>Dynamic and static QR code generation</li>
                <li>QR code analytics and tracking</li>
                <li>Inventory management with QR code integration</li>
                <li>Customization options for QR codes</li>
                <li>Bulk QR code generation and management</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and accept all risks of unauthorized access</li>
                <li>Notify us immediately if you discover any security breaches</li>
                <li>Be at least 18 years of age to create an account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>Violate any applicable laws or regulations, including South African law</li>
                <li>Infringe upon the rights of others</li>
                <li>Distribute malware, spam, or harmful content</li>
                <li>Create QR codes linking to illegal, fraudulent, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Collect personal information without proper consent under POPIA</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Subscription and Payments</h2>
              <p className="text-muted-foreground leading-relaxed">
                Some features of the Service require a paid subscription. By subscribing:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>You authorize us to charge your payment method on a recurring basis</li>
                <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
                <li>All prices are in South African Rand (ZAR) unless otherwise stated</li>
                <li>Refunds are provided in accordance with our refund policy and the Consumer Protection Act</li>
                <li>Prices may change with 30 days notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Consumer Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                In accordance with the Consumer Protection Act 68 of 2008 (CPA) of South Africa:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>You have the right to cancel your subscription within 5 business days of initial sign-up for a full refund</li>
                <li>All pricing includes VAT where applicable</li>
                <li>You have the right to receive services that are of good quality and fit for purpose</li>
                <li>You have the right to fair and honest dealing</li>
                <li>You have access to our complaints process (contact support@ieosuia.com)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Protection (POPIA)</h2>
              <p className="text-muted-foreground leading-relaxed">
                We process personal information in accordance with the Protection of Personal Information 
                Act 4 of 2013 (POPIA). By using our Service, you acknowledge that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>We collect and process personal information as described in our Privacy Policy</li>
                <li>You have the rights outlined in POPIA regarding your personal information</li>
                <li>We implement appropriate security measures to protect your data</li>
                <li>You can contact our Information Officer at support@ieosuia.com</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Please review our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for 
                full details on how we handle your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service and its original content, features, and functionality are owned by IEOSUIA 
                and are protected by international copyright, trademark, patent, trade secret, and other 
                intellectual property laws. You retain ownership of content you create using our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without 
                prior notice or liability, for any reason, including breach of these Terms. Upon termination, 
                your right to use the Service will cease immediately. You may terminate your account at any 
                time through your account settings or by contacting support.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by South African law, IEOSUIA, its directors, employees, 
                partners, agents, suppliers, or affiliates shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including without limitation, loss of profits, 
                data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, 
                expressed or implied, regarding the Service's reliability, availability, or fitness for 
                a particular purpose, except as required by the Consumer Protection Act.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Governing Law and Jurisdiction</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the 
                Republic of South Africa. Any disputes arising from these Terms or your use of the 
                Service shall be subject to the exclusive jurisdiction of the courts of South Africa, 
                specifically the Gauteng Division of the High Court.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. We will provide notice 
                of any significant changes via email or through the Service. Your continued use of the 
                Service after such modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">14. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-card rounded-lg border border-border text-muted-foreground space-y-2">
                <p><strong className="text-foreground">Email:</strong> support@ieosuia.com</p>
                <p><strong className="text-foreground">General Inquiries:</strong> hello@ieosuia.com</p>
                <p><strong className="text-foreground">Address:</strong> 26 Rock Alder, Extension 15, Naturena, Johannesburg, 2095</p>
                <p><strong className="text-foreground">Phone:</strong> 079 928 2775 / 063 154 0696</p>
              </div>
            </section>

            <section className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Related Policies</h2>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link>
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

export default TermsOfService;
