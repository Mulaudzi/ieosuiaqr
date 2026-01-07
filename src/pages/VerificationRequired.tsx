import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QrCode, Mail, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/api/auth";
import { useToast } from "@/hooks/use-toast";
import { useRateLimit, rateLimitConfigs } from "@/hooks/useRateLimit";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

export default function VerificationRequired() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const {
    isBlocked,
    attemptsLeft,
    recordAttempt,
    formatRemainingTime,
  } = useRateLimit(rateLimitConfigs.resendVerification);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    if (isBlocked) {
      toast({
        variant: "destructive",
        title: "Too many attempts",
        description: `Please wait ${formatRemainingTime()} before trying again.`,
      });
      return;
    }
    
    setIsResending(true);
    recordAttempt();
    
    try {
      const response = await authApi.resendVerification();
      if (response.success) {
        toast({
          title: "Verification email sent",
          description: "Please check your inbox for the verification link.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to send",
          description: response.message || "Please try again later.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send verification email. Please try again.",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-warning/10 via-accent/5 to-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-warning/20 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <QrCode className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold">
              <span className="gradient-text">IEOSUIA</span>
            </span>
          </Link>
          
          <h1 className="font-display text-4xl font-bold mb-4">
            Almost There!
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Please verify your email address to unlock all features and start creating QR codes.
          </p>
        </div>
      </div>

      {/* Right side - Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">
              <span className="gradient-text">IEOSUIA</span>
            </span>
          </div>

          <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-warning" />
          </div>

          <h2 className="font-display text-2xl font-bold mb-2">
            Verify Your Email
          </h2>
          <p className="text-muted-foreground mb-6">
            We sent a verification link to{" "}
            <strong className="text-foreground">{user?.email || "your email"}</strong>.
            Please check your inbox and click the link to verify your account.
          </p>

          <div className="p-4 rounded-xl bg-muted/50 border border-border mb-6">
            <div className="flex items-center gap-3 text-left">
              <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Didn't receive the email?</p>
                <p className="text-xs text-muted-foreground">
                  Check your spam folder or request a new verification link.
                </p>
              </div>
            </div>
          </div>

          {isBlocked && (
            <Alert variant="destructive" className="mb-6">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Too many attempts. Please wait {formatRemainingTime()} before trying again.
              </AlertDescription>
            </Alert>
          )}

          {!isBlocked && attemptsLeft < 3 && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              variant="hero"
              className="w-full"
              onClick={handleResendVerification}
              disabled={isResending || isBlocked}
            >
              {isResending ? "Sending..." : isBlocked ? `Wait ${formatRemainingTime()}` : "Resend Verification Email"}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Already verified?{" "}
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline font-medium"
            >
              Refresh this page
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
