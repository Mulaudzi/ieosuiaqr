import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from "lucide-react";

export default function BillingError() {
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get("error") || "Payment was cancelled or failed";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto"
          >
            <XCircle className="w-10 h-10 text-destructive" />
          </motion.div>

          <div>
            <h1 className="font-display text-2xl font-bold mb-2">
              Payment Failed
            </h1>
            <p className="text-muted-foreground">
              {errorMessage}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/50 border border-border text-left">
            <h3 className="font-semibold mb-3">What happened?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• The payment was cancelled or declined</li>
              <li>• There may have been a network issue</li>
              <li>• Your card may have insufficient funds</li>
              <li>• The payment gateway may be temporarily unavailable</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button variant="hero" asChild>
              <Link to="/dashboard/settings?tab=billing">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/support">
                <HelpCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
