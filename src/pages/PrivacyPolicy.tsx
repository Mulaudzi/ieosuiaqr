import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const PrivacyPolicy = () => {
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

          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 13, 2025</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                IEOSUIA QR ("we", "our", or "us") is committed to protecting your privacy. This Privacy 
                Policy explains how we collect, use, disclose, and safeguard your information when you 
                use our QR code generation and management service. We comply with the Protection of Personal 
                Information Act (POPIA) of South Africa and other applicable data protection laws.
              </p>
            </section>

            {/* POPIA Compliance Section */}
            <section id="popia" className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">POPIA Compliance</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                As a South African company, we are committed to complying with the Protection of Personal 
                Information Act (POPIA). This means:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Accountability:</strong> We take responsibility for all personal information we process and have designated an Information Officer.</li>
                <li><strong className="text-foreground">Processing Limitation:</strong> We only collect personal information that is necessary and relevant for our services.</li>
                <li><strong className="text-foreground">Purpose Specification:</strong> We collect personal information for specific, lawful purposes that we clearly communicate to you.</li>
                <li><strong className="text-foreground">Further Processing:</strong> We do not process personal information for purposes incompatible with the original collection purpose.</li>
                <li><strong className="text-foreground">Information Quality:</strong> We take steps to ensure personal information is complete, accurate, and up to date.</li>
                <li><strong className="text-foreground">Openness:</strong> We are transparent about how we collect and process personal information.</li>
                <li><strong className="text-foreground">Security Safeguards:</strong> We implement appropriate technical and organizational measures to protect personal information.</li>
                <li><strong className="text-foreground">Data Subject Participation:</strong> You have the right to access, correct, and delete your personal information.</li>
              </ul>
              <div className="mt-4 p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Information Officer:</strong> For POPIA-related queries, contact us at{" "}
                  <a href="mailto:support@ieosuia.com" className="text-primary hover:underline">support@ieosuia.com</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                We may collect personal information that you voluntarily provide, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>Name and email address</li>
                <li>Account credentials</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Profile information and preferences</li>
                <li>Company name and contact details (if provided)</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Automatically Collected Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you use our Service, we automatically collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>Device information (browser type, operating system)</li>
                <li>IP address and approximate location</li>
                <li>Usage data and analytics</li>
                <li>QR code scan data and statistics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Legal Basis for Processing</h2>
              <p className="text-muted-foreground leading-relaxed">
                Under POPIA, we process your personal information based on:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li><strong className="text-foreground">Consent:</strong> When you create an account or opt-in to communications</li>
                <li><strong className="text-foreground">Contract:</strong> To provide the services you've requested</li>
                <li><strong className="text-foreground">Legal obligation:</strong> When required by law</li>
                <li><strong className="text-foreground">Legitimate interest:</strong> For service improvement and security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the collected information for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>Providing and maintaining our Service</li>
                <li>Processing transactions and sending related information</li>
                <li>Sending promotional communications (with your consent)</li>
                <li>Providing customer support</li>
                <li>Analyzing usage to improve our Service</li>
                <li>Detecting and preventing fraud or abuse</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. QR Code Scan Data</h2>
              <p className="text-muted-foreground leading-relaxed">
                When someone scans a QR code created through our Service, we collect:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>Time and date of scan</li>
                <li>Approximate geographic location (city/country level)</li>
                <li>Device type and operating system</li>
                <li>Referrer information</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                This data is used to provide analytics to QR code owners and is processed in accordance 
                with POPIA and other applicable privacy laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may share your information with:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li><strong className="text-foreground">Service Providers:</strong> Third parties that help us operate our Service (all bound by confidentiality agreements)</li>
                <li><strong className="text-foreground">Business Transfers:</strong> In connection with mergers or acquisitions</li>
                <li><strong className="text-foreground">Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong className="text-foreground">With Your Consent:</strong> For any other purpose with your explicit consent</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal 
                information as required by POPIA, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
                <li>Secure data storage practices</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information only for as long as necessary to fulfill the purposes 
                outlined in this Privacy Policy, unless a longer retention period is required by law. 
                QR code scan analytics are retained for the duration of your subscription plus 30 days.
                Upon account deletion, we will securely delete your personal information within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Your Rights Under POPIA</h2>
              <p className="text-muted-foreground leading-relaxed">
                Under the Protection of Personal Information Act, you have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li><strong className="text-foreground">Access:</strong> Request a copy of your personal information</li>
                <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate data</li>
                <li><strong className="text-foreground">Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                <li><strong className="text-foreground">Object:</strong> Object to processing of your personal information</li>
                <li><strong className="text-foreground">Restrict:</strong> Request restriction of processing</li>
                <li><strong className="text-foreground">Withdraw Consent:</strong> Withdraw consent at any time</li>
                <li><strong className="text-foreground">Complain:</strong> Lodge a complaint with the Information Regulator</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise these rights, please contact us at{" "}
                <a href="mailto:support@ieosuia.com" className="text-primary hover:underline">support@ieosuia.com</a>.
                We will respond within 30 days as required by POPIA.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
                <li>Maintain your session and preferences</li>
                <li>Analyze usage patterns</li>
                <li>Improve our Service</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You can control cookie preferences through your browser settings. See our{" "}
                <Link to="/cookies" className="text-primary hover:underline">Cookie Policy</Link> for more details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is not intended for children under 18 years of age. We do not knowingly 
                collect personal information from children. If you become aware that a child 
                has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than South Africa. 
                When we transfer data internationally, we ensure appropriate safeguards are in place as 
                required by POPIA, including ensuring the recipient country has adequate data protection 
                laws or implementing appropriate contractual protections.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                For significant changes, we will notify you via email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">14. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, our data practices, or wish to exercise 
                your rights under POPIA, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-card rounded-lg border border-border text-muted-foreground space-y-2">
                <p><strong className="text-foreground">Email:</strong> support@ieosuia.com</p>
                <p><strong className="text-foreground">General Inquiries:</strong> hello@ieosuia.com</p>
                <p><strong className="text-foreground">Address:</strong> 26 Rock Alder, Extension 15, Naturena, Johannesburg, 2095</p>
                <p><strong className="text-foreground">Phone:</strong> 079 928 2775 / 063 154 0696</p>
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4">
                If you are not satisfied with our response, you have the right to lodge a complaint with the 
                Information Regulator of South Africa at{" "}
                <a href="https://www.justice.gov.za/inforeg/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  www.justice.gov.za/inforeg
                </a>.
              </p>
            </section>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
