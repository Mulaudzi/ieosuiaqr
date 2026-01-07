import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, ArrowLeft, Mail, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { authApi } from "@/services/api/auth";
import { useToast } from "@/hooks/use-toast";
import { useRateLimit, rateLimitConfigs } from "@/hooks/useRateLimit";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  
  const {
    isBlocked,
    attemptsLeft,
    recordAttempt,
    formatRemainingTime,
  } = useRateLimit(rateLimitConfigs.forgotPassword);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      toast({
        variant: "destructive",
        title: "Too many attempts",
        description: `Please wait ${formatRemainingTime()} before trying again.`,
      });
      return;
    }

    if (!email || !validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsLoading(true);
    recordAttempt();

    try {
      const response = await authApi.forgotPassword({ email: email.trim() });
      
      if (response.success) {
        setIsSuccess(true);
        toast({
          title: "Email sent",
          description: "Check your inbox for password reset instructions.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Request failed",
          description: response.message || "Unable to send reset email.",
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      
      if (err.response?.status === 429) {
        toast({
          variant: "destructive",
          title: "Too many requests",
          description: "Please wait before requesting another reset email.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.response?.data?.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-accent/5 to-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
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
            Reset Your Password
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
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

          <Link
            to="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>

          {isSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Check your email</h2>
              <p className="text-muted-foreground mb-6">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => setIsSuccess(false)}
                  className="text-primary hover:underline"
                  disabled={isBlocked}
                >
                  try again
                </button>
                {isBlocked && (
                  <span className="block mt-2 text-warning">
                    (available in {formatRemainingTime()})
                  </span>
                )}
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link to="/login">Return to login</Link>
              </Button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold mb-2">Forgot password?</h2>
              <p className="text-muted-foreground mb-6">
                No worries, we'll send you reset instructions.
              </p>

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

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading || isBlocked}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  disabled={isLoading || isBlocked}
                >
                  {isLoading ? "Sending..." : isBlocked ? `Wait ${formatRemainingTime()}` : "Send reset link"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-8">
                Remember your password?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
