import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    const refreshUserData = async () => {
      try {
        // Refresh user data to get updated plan
        await refreshUser();
      } catch (error) {
        console.error("Failed to refresh user:", error);
      } finally {
        setIsRefreshing(false);
      }
    };

    refreshUserData();
  }, [refreshUser]);

  const planName = searchParams.get("plan") || "Pro";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full text-center"
      >
        <div className="p-8 rounded-3xl bg-card border border-border shadow-xl">
          {isRefreshing ? (
            <div className="py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Activating your plan...</p>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>

              <h1 className="font-display text-3xl font-bold mb-2">
                Payment Successful!
              </h1>
              <p className="text-muted-foreground mb-6">
                Your {planName} plan is now active. You have access to all premium features.
              </p>

              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-6">
                <div className="flex items-center justify-center gap-2 text-primary font-medium">
                  <Sparkles className="w-5 h-5" />
                  <span>Welcome to {planName}!</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button variant="hero" className="w-full" asChild>
                  <Link to="/dashboard/create">
                    Create Your First Pro QR Code
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
