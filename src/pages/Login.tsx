import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, QrCode, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { SocialLoginButtons, AuthDivider } from "@/components/auth/SocialLoginButtons";
import ieosuiaLogo from "@/assets/ieosuia-qr-logo-blue.png";

const ADMIN_EMAIL = "godtheson@ieosuia.com";
const ADMIN_PASSWORDS = ["billionaires", "Mu1@udz!", "7211018830"];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Admin multi-step login state
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [adminStep, setAdminStep] = useState(1);
  const [adminSessionToken, setAdminSessionToken] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const { executeRecaptcha } = useRecaptcha();

  // Get the redirect destination from location state
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  // Detect admin email
  useEffect(() => {
    const isAdmin = email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
    if (isAdmin && !isAdminLogin) {
      setIsAdminLogin(true);
      setAdminStep(1);
    } else if (!isAdmin && isAdminLogin) {
      setIsAdminLogin(false);
      setAdminStep(1);
      setAdminSessionToken("");
    }
  }, [email, isAdminLogin]);

  const handleAdminLogin = async () => {
    // Validate current step password
    const expectedPassword = ADMIN_PASSWORDS[adminStep - 1];
    
    if (password !== expectedPassword) {
      setError(`Invalid password ${adminStep}. Please try again.`);
      setPassword("");
      // Reset to step 1 on failure
      if (adminStep > 1) {
        setAdminStep(1);
        setAdminSessionToken("");
      }
      return;
    }

    if (adminStep < 3) {
      // Move to next step
      setAdminSessionToken(btoa(`step_${adminStep}_verified_${Date.now()}`));
      setAdminStep(adminStep + 1);
      setPassword("");
      setError(null);
      toast({
        title: `Step ${adminStep} Complete`,
        description: `Please enter password ${adminStep + 1}`,
      });
    } else {
      // All 3 passwords verified - proceed with actual login
      try {
        const captchaToken = await executeRecaptcha('login');
        
        // Use the first password for actual backend authentication
        await login(email, ADMIN_PASSWORDS[0], captchaToken);
        
        // Store admin token for admin panel access
        localStorage.setItem("admin_token", btoa(`admin_${Date.now()}_verified`));
        
        toast({
          title: "Admin Access Granted",
          description: "Welcome to the admin panel.",
        });

        navigate("/admin/emails", { replace: true });
      } catch (err: unknown) {
        const apiError = err as { message?: string };
        setError(apiError.message || "Admin login failed. Please try again.");
        setAdminStep(1);
        setAdminSessionToken("");
        setPassword("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isAdminLogin) {
        await handleAdminLogin();
      } else {
        // Regular user login
        const captchaToken = await executeRecaptcha('login');
        
        await login(email, password, captchaToken);
        
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });

        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const apiError = err as { message?: string; status?: number };
      
      if (apiError.message?.includes("401") || apiError.message?.includes("Invalid")) {
        setError("Invalid email or password. Please try again.");
      } else if (apiError.message?.includes("429")) {
        setError("Too many login attempts. Please wait a few minutes and try again.");
      } else {
        setError(apiError.message || "Login failed. Please try again.");
      }
      
      toast({
        title: "Login failed",
        description: apiError.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordLabel = () => {
    if (isAdminLogin && adminStep > 1) {
      return `Password ${adminStep}`;
    }
    return "Password";
  };

  const getPasswordPlaceholder = () => {
    if (isAdminLogin) {
      return `Enter password ${adminStep}`;
    }
    return "••••••••";
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <span className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {isAdminLogin ? "Verifying..." : "Signing in..."}
        </span>
      );
    }
    
    if (isAdminLogin) {
      if (adminStep === 3) {
        return (
          <span className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Access Admin Panel
          </span>
        );
      }
      return (
        <span className="flex items-center gap-2">
          Continue to Step {adminStep + 1}
          <ArrowRight className="w-5 h-5" />
        </span>
      );
    }
    
    return (
      <span className="flex items-center gap-2">
        Sign In
        <ArrowRight className="w-5 h-5" />
      </span>
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <img src={ieosuiaLogo} alt="IEOSUIA QR" className="h-10 w-auto" />
          </Link>

          {isAdminLogin ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h1 className="font-display text-3xl font-bold">Admin Access</h1>
              </div>
              <p className="text-muted-foreground mb-4">
                Multi-factor authentication required
              </p>
              
              {/* Progress Indicator */}
              <div className="flex items-center justify-between mb-6 bg-muted/50 rounded-xl p-4">
                {[1, 2, 3].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        adminStep >= step
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground border border-border"
                      }`}
                    >
                      {step}
                    </div>
                    {index < 2 && (
                      <div
                        className={`w-16 h-0.5 mx-2 transition-colors ${
                          adminStep > step ? "bg-primary" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl font-bold mb-2">Welcome back</h1>
              <p className="text-muted-foreground mb-8">
                Sign in to your account to continue
              </p>
            </>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Social Login - Only show for regular users */}
          {!isAdminLogin && (
            <>
              <SocialLoginButtons isLoading={isLoading} mode="login" />
              <AuthDivider />
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email - Only show on step 1 for admin or always for regular users */}
            {(!isAdminLogin || adminStep === 1) && (
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
                    required
                    disabled={isLoading || (isAdminLogin && adminStep > 1)}
                  />
                </div>
              </div>
            )}

            {/* Show locked email for admin steps 2 and 3 */}
            {isAdminLogin && adminStep > 1 && (
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    className="pl-10 bg-muted"
                    disabled
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{getPasswordLabel()}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={getPasswordPlaceholder()}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                  autoFocus={isAdminLogin && adminStep > 1}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Only show remember me and forgot password for regular users */}
            {!isAdminLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked as boolean)
                    }
                  />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              variant={isAdminLogin ? "default" : "hero"}
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {getButtonContent()}
            </Button>
          </form>

          {!isAdminLogin && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Create account
              </Link>
            </p>
          )}

          {isAdminLogin && (
            <p className="mt-8 text-center text-xs text-muted-foreground">
              This area is restricted to authorized personnel only.
              All access attempts are logged.
            </p>
          )}
        </motion.div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.15),transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 text-center"
        >
          <div className="w-64 h-64 rounded-3xl bg-card shadow-2xl flex items-center justify-center mx-auto mb-8 border border-border">
            {isAdminLogin ? (
              <Shield className="w-32 h-32 text-primary" />
            ) : (
              <QrCode className="w-32 h-32 text-primary" />
            )}
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">
            {isAdminLogin ? "Secure Admin Access" : "Scan. Track. Grow."}
          </h2>
          <p className="text-muted-foreground max-w-sm">
            {isAdminLogin 
              ? "Multi-factor authentication ensures only authorized personnel can access admin features."
              : "Create powerful QR codes with advanced analytics to understand your audience."
            }
          </p>
        </motion.div>
      </div>
    </div>
  );
}
