import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adminApi } from "@/services/api/admin";
import ieosuiaLogo from "@/assets/ieosuia-qr-logo-blue.png";

const ADMIN_LAST_ACTIVITY_KEY = 'admin_last_activity';
const MAX_ATTEMPTS = 5;

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [password3, setPassword3] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_ATTEMPTS);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedMinutes, setLockedMinutes] = useState(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await adminApi.batchLogin(email, password1, password2, password3);
      
      if (response.success && response.data) {
        // Store admin token and activity timestamp
        localStorage.setItem("admin_token", response.data.admin_token);
        localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, Date.now().toString());
        
        toast({
          title: "Admin Access Granted",
          description: "Welcome to the admin panel. Session expires after 30 minutes of inactivity.",
        });

        navigate("/admin/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      const apiError = err as { 
        message?: string; 
        status?: number;
        remaining_attempts?: number;
        locked?: boolean;
        locked_minutes?: number;
      };
      
      if (apiError.locked) {
        setIsLocked(true);
        setLockedMinutes(apiError.locked_minutes || 15);
        setRemainingAttempts(0);
        setError(`Account locked. Try again in ${apiError.locked_minutes || 15} minutes.`);
      } else {
        setRemainingAttempts(apiError.remaining_attempts ?? remainingAttempts - 1);
        setError("Authentication failed");
      }
      
      // Clear password fields on failure
      setPassword1("");
      setPassword2("");
      setPassword3("");
    } finally {
      setIsLoading(false);
    }
  };

  const attemptsPercent = (remainingAttempts / MAX_ATTEMPTS) * 100;

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

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold">Admin Access</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Enter all three authentication passwords
          </p>
          
          {/* Rate Limit Indicator */}
          {remainingAttempts < MAX_ATTEMPTS && (
            <div className="mb-6 p-4 rounded-xl bg-muted/50 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Remaining attempts</span>
                <span className={`font-medium ${remainingAttempts <= 2 ? "text-destructive" : "text-foreground"}`}>
                  {remainingAttempts} / {MAX_ATTEMPTS}
                </span>
              </div>
              <Progress 
                value={attemptsPercent} 
                className={`h-2 ${remainingAttempts <= 2 ? "[&>div]:bg-destructive" : ""}`}
              />
              {remainingAttempts <= 2 && (
                <p className="text-xs text-destructive">
                  Warning: Account will be locked after {remainingAttempts} more failed attempt{remainingAttempts !== 1 ? 's' : ''}.
                </p>
              )}
            </div>
          )}

          {/* Locked Account Warning */}
          {isLocked && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Account temporarily locked due to too many failed attempts. 
                Please try again in {lockedMinutes} minutes.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && !isLocked && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading || isLocked}
                />
              </div>
            </div>

            {/* All 3 password fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Authentication Passwords
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="h-8 px-2"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="ml-1 text-xs">{showPasswords ? "Hide" : "Show"}</span>
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="password1" className="text-sm">Password 1</Label>
                  <Input
                    id="password1"
                    type={showPasswords ? "text" : "password"}
                    placeholder="Enter password 1"
                    value={password1}
                    onChange={(e) => setPassword1(e.target.value)}
                    required
                    disabled={isLoading || isLocked}
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password2" className="text-sm">Password 2</Label>
                  <Input
                    id="password2"
                    type={showPasswords ? "text" : "password"}
                    placeholder="Enter password 2"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                    disabled={isLoading || isLocked}
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password3" className="text-sm">Password 3</Label>
                  <Input
                    id="password3"
                    type={showPasswords ? "text" : "password"}
                    placeholder="Enter password 3"
                    value={password3}
                    onChange={(e) => setPassword3(e.target.value)}
                    required
                    disabled={isLoading || isLocked}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading || isLocked}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Access Admin Panel
                </span>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            This area is restricted to authorized personnel only.
            All access attempts are logged.
          </p>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              ← Back to user login
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-destructive/5 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--destructive)/0.15),transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative z-10 text-center"
        >
          <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-destructive/20 to-destructive/5 flex items-center justify-center border border-destructive/20">
            <Shield className="w-16 h-16 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Secure Admin Portal</h2>
          <p className="text-muted-foreground max-w-sm">
            Multi-factor authentication required for administrative access.
            Your session will be monitored.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
