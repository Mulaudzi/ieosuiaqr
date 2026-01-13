import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

export default function AdminLogin() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1 && !username.trim()) {
      toast({
        variant: "destructive",
        title: "Username required",
        description: "Please enter the admin username.",
      });
      return;
    }
    
    if (!password.trim()) {
      toast({
        variant: "destructive",
        title: "Password required",
        description: `Please enter password ${step}.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step,
          username: step === 1 ? username : undefined,
          password,
          session_token: sessionToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (data.data.admin_token) {
        // Final step - save admin token and redirect
        localStorage.setItem("admin_token", data.data.admin_token);
        toast({
          title: "Access Granted",
          description: "Welcome to the admin panel.",
        });
        navigate("/admin/emails");
      } else if (data.data.next_step) {
        // Move to next step
        setSessionToken(data.data.session_token);
        setStep(data.data.next_step);
        setPassword("");
        toast({
          title: `Step ${step} Complete`,
          description: data.data.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
      // Reset on failure
      if (step > 1) {
        setStep(1);
        setSessionToken("");
      }
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = [
    { step: 1, label: "Enter Username & Password 1" },
    { step: 2, label: "Enter Password 2" },
    { step: 3, label: "Enter Password 3" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            <p className="text-white/80 text-sm mt-2">
              Multi-factor authentication required
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="px-8 pt-6">
            <div className="flex items-center justify-between mb-6">
              {stepLabels.map((s, index) => (
                <div key={s.step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step >= s.step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.step}
                  </div>
                  {index < stepLabels.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-2 transition-colors ${
                        step > s.step ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center mb-2">
              {stepLabels[step - 1].label}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
            {step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  autoComplete="off"
                  autoFocus
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {step > 1 ? step : ""}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Enter password ${step}`}
                  className="pl-10 pr-10"
                  autoComplete="off"
                  autoFocus={step > 1}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : step === 3 ? (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Access Admin Panel
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-8">
            <p className="text-xs text-muted-foreground text-center">
              This area is restricted to authorized personnel only.
              All access attempts are logged.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
