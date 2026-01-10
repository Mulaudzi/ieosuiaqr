import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { QrCode, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authHelpers } from "@/services/api/auth";
import { useAuth } from "@/contexts/AuthContext";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        switch (error) {
          case "google_auth_cancelled":
            setErrorMessage("Google sign-in was cancelled.");
            break;
          case "google_auth_failed":
            setErrorMessage("Google sign-in failed. Please try again.");
            break;
          case "invalid_state":
            setErrorMessage("Security verification failed. Please try again.");
            break;
          default:
            setErrorMessage("An error occurred during sign-in.");
        }
        return;
      }

      if (token) {
        // Store the token
        localStorage.setItem("auth_token", token);
        
        // Refresh user data
        await refreshUser();
        
        setStatus("success");
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1500);
      } else {
        setStatus("error");
        setErrorMessage("No authentication token received.");
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
          <QrCode className="w-8 h-8 text-primary-foreground" />
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">
              Completing Sign In...
            </h1>
            <p className="text-muted-foreground">
              Please wait while we set up your account.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-10 h-10 text-success mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">
              Welcome!
            </h1>
            <p className="text-muted-foreground">
              Sign in successful. Redirecting to dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">
              Sign In Failed
            </h1>
            <p className="text-muted-foreground mb-6">
              {errorMessage}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/login")}>
                Back to Login
              </Button>
              <Button onClick={() => navigate("/signup")}>
                Create Account
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
