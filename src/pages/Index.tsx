import { useEffect, useState } from "react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useNavigate } from "react-router-dom";
import { motion, MotionConfig } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { CTASection } from "@/components/landing/CTASection";
import { ProductShowcaseSection } from "@/components/landing/ProductShowcaseSection";
import { AnalyticsShowcaseSection } from "@/components/landing/AnalyticsShowcaseSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { AvailabilitySection } from "@/components/landing/AvailabilitySection";
import { FAQSection } from "@/components/landing/FAQSection";
import { EcosystemSection } from "@/components/landing/EcosystemSection";
import { IEOSUIAQrLogo } from "@/components/brand/IEOSUIAQrLogo";

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate("/dashboard", { replace: true });
      } else {
        setShowContent(true);
      }
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Show loading spinner while checking auth
  if (isLoading || !showContent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-6"
        >
          <IEOSUIAQrLogo variant="standard" className="w-[220px] sm:w-[260px]" />
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <HeroSection />
          <AvailabilitySection />
          <FeaturesSection />
          <ProductShowcaseSection />
          <AnalyticsShowcaseSection />
          <HowItWorksSection />
          <UseCasesSection />
          <TrustSection />
          <FAQSection />
          <CTASection />
        </main>
        <EcosystemSection />
        <Footer />
        <WhatsAppButton />
      </div>
    </MotionConfig>
  );
};

export default Index;
