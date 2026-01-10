import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "cookie-consent";

type ConsentStatus = "accepted" | "rejected" | null;

export function CookieConsent() {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!storedConsent) {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
    setConsentStatus(storedConsent as ConsentStatus);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setConsentStatus("accepted");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setConsentStatus("rejected");
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Don't render if consent has already been given
  if (consentStatus) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="mx-auto max-w-4xl">
            <div className="relative rounded-xl border border-border bg-card p-4 shadow-lg md:p-6">
              <button
                onClick={handleClose}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                <div className="flex items-start gap-3 md:items-center">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Cookie className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 pr-6 md:pr-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      We use cookies
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We use cookies to enhance your browsing experience, analyze
                      site traffic, and personalize content. By clicking "Accept
                      All", you consent to our use of cookies.{" "}
                      <Link
                        to="/cookies"
                        className="text-primary hover:underline"
                      >
                        Learn more
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="flex flex-shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    className="flex-1 md:flex-none"
                  >
                    Reject All
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    className="flex-1 md:flex-none"
                  >
                    Accept All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
