import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ArrowRight, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const { refreshUser } = useAuth();
  const { plan, refreshPlan } = useUserPlan();

  useEffect(() => {
    const refresh = async () => {
      try {
        await refreshUser();
        await refreshPlan();
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      } finally {
        setIsRefreshing(false);
      }
    };

    refresh();
  }, [refreshUser, refreshPlan]);

  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {isRefreshing ? (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold mb-2">
                Processing Payment...
              </h1>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="w-10 h-10 text-success" />
            </motion.div>

            <div>
              <h1 className="font-display text-2xl font-bold mb-2">
                Payment Successful!
              </h1>
              <p className="text-muted-foreground mb-4">
                Thank you for upgrading. Your plan has been activated.
              </p>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                <Crown className="w-5 h-5" />
                {planName} Plan Active
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border text-left">
              <h3 className="font-semibold mb-3">What's next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                  <span>Access all premium QR code types</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                  <span>Track scans and view analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                  <span>Add custom logos to your QR codes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                  <span>A receipt has been sent to your email</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button variant="hero" asChild>
                <Link to="/dashboard/create">
                  Create a QR Code
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
