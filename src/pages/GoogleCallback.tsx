import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authHelpers } from "@/services/api/auth";
import { QrCode, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError(decodeURIComponent(errorParam));
        return;
      }

      if (!token) {
        setError("No authentication token received. Please try again.");
        return;
      }

      try {
        // Decode the token to get user info (the token contains base64 encoded JSON)
        const tokenData = JSON.parse(atob(token));
        
        if (tokenData.access_token && tokenData.user) {
          authHelpers.setAuth(
            { 
              access_token: tokenData.access_token, 
              token_type: "Bearer", 
              expires_in: tokenData.expires_in || 3600 
            },
            tokenData.user
          );
          await refreshUser();
          navigate("/dashboard", { replace: true });
        } else {
          setError("Invalid authentication response. Please try again.");
        }
      } catch {
        setError("Failed to process authentication. Please try again.");
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold mb-2">Authentication Failed</h1>
            <Alert variant="destructive" className="text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
          <Button onClick={() => navigate("/login")} variant="outline">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <QrCode className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-xl font-bold">Signing you in...</h1>
          <p className="text-muted-foreground">Please wait while we complete your authentication.</p>
        </div>
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
      </div>
    </div>
  );
}