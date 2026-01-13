import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw, MessageSquare } from "lucide-react";

export default function BillingError() {
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get("error") || searchParams.get("message");
  const errorCode = searchParams.get("code");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full text-center"
      >
        <div className="p-8 rounded-3xl bg-card border border-border shadow-xl">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-destructive to-red-600 flex items-center justify-center mx-auto mb-6"
          >
            <XCircle className="w-10 h-10 text-white" />
          </motion.div>

          <h1 className="font-display text-3xl font-bold mb-2">
            Payment Failed
          </h1>
          <p className="text-muted-foreground mb-6">
            {errorMessage || "There was a problem processing your payment. Please try again."}
          </p>

          {errorCode && (
            <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 mb-6">
              <p className="text-sm text-destructive font-mono">
                Error code: {errorCode}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button variant="hero" className="w-full" asChild>
              <Link to="/dashboard/settings?tab=billing">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/contact">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
              </Link>
            </Button>
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              If you continue to experience issues, please contact our support team at{" "}
              <a href="mailto:support@ieosuia.com" className="text-primary hover:underline">
                support@ieosuia.com
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
