import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowLeft } from "lucide-react";
import { authApi } from "@/services/api/auth";
import { useAuth } from "@/contexts/AuthContext";

type VerificationStatus = "verifying" | "success" | "error" | "no-token";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    const verifyEmail = async () => {
      try {
        await authApi.verifyEmail(token);
        setStatus("success");
        // Refresh user data to update verified status
        await refreshUser();
        // Auto-redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2000);
      } catch (error: unknown) {
        setStatus("error");
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
          if (axiosError.response?.status === 400) {
            setErrorMessage("This verification link is invalid or has expired.");
          } else if (axiosError.response?.status === 410) {
            setErrorMessage("This email has already been verified.");
          } else {
            setErrorMessage(axiosError.response?.data?.message || "Failed to verify email. Please try again.");
          }
        } else {
          setErrorMessage("Network error. Please check your connection and try again.");
        }
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      await authApi.resendVerification();
      setResendSuccess(true);
    } catch (error) {
      setErrorMessage("Failed to resend verification email. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Verifying your email...</p>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground">Email Verified!</h3>
              <p className="mt-2 text-muted-foreground">
                Your email has been successfully verified. Redirecting to dashboard...
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecting automatically...</span>
            </div>
            <Button variant="outline" onClick={() => navigate("/dashboard", { replace: true })} className="mt-2">
              Go to Dashboard Now
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-destructive/10 p-4">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground">Verification Failed</h3>
              <p className="mt-2 text-muted-foreground">{errorMessage}</p>
            </div>
            {resendSuccess ? (
              <Alert className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  A new verification email has been sent. Please check your inbox.
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                variant="outline"
                onClick={handleResendVerification}
                disabled={isResending}
                className="mt-4"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            )}
          </div>
        );

      case "no-token":
        return (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-muted p-4">
              <Mail className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground">No Verification Token</h3>
              <p className="mt-2 text-muted-foreground">
                This page requires a verification token from your email link.
              </p>
            </div>
            {resendSuccess ? (
              <Alert className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  A new verification email has been sent. Please check your inbox.
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                variant="outline"
                onClick={handleResendVerification}
                disabled={isResending}
                className="mt-4"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            Verify your email address to unlock all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
