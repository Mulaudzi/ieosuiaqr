import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/services/api/admin";
import { Shield, UserPlus, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function AdminCreate() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [password3, setPassword3] = useState("");
  
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showPassword3, setShowPassword3] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check admin session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const result = await adminApi.checkSession();
        if (!result.success) {
          throw new Error("Invalid session");
        }
        setIsLoading(false);
      } catch {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Please login as admin first."
        });
        navigate("/admin/login", { replace: true });
      }
    };
    
    checkSession();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await adminApi.createAdmin({
        email,
        name,
        password1,
        password2,
        password3
      });

      setSuccess(true);
      toast({
        title: "Admin Created!",
        description: `Admin user ${email} has been created successfully.`
      });

      // Reset form
      setEmail("");
      setName("");
      setPassword1("");
      setPassword2("");
      setPassword3("");
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || "Failed to create admin user");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-xl mx-auto">
        <AdminBreadcrumb />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Create Admin User</CardTitle>
                  <CardDescription>
                    Add a new administrator with multi-step authentication
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {success && (
                <Alert className="mb-6 bg-success/10 border-success/20">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">
                    Admin user created successfully! They can now login using the 3-step authentication.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Admin Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Section */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Shield className="w-4 h-4" />
                    <span>Multi-Step Authentication Passwords</span>
                  </div>

                  {/* Password 1 */}
                  <div className="space-y-2">
                    <Label htmlFor="password1">Password 1 (Primary - min 8 chars)</Label>
                    <div className="relative">
                      <Input
                        id="password1"
                        type={showPassword1 ? "text" : "password"}
                        placeholder="Enter primary password"
                        value={password1}
                        onChange={(e) => setPassword1(e.target.value)}
                        className="pr-10"
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword1(!showPassword1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password 2 */}
                  <div className="space-y-2">
                    <Label htmlFor="password2">Password 2 (Step 2 - min 6 chars)</Label>
                    <div className="relative">
                      <Input
                        id="password2"
                        type={showPassword2 ? "text" : "password"}
                        placeholder="Enter step 2 password"
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        className="pr-10"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword2(!showPassword2)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password 3 */}
                  <div className="space-y-2">
                    <Label htmlFor="password3">Password 3 (Step 3 - min 6 chars)</Label>
                    <div className="relative">
                      <Input
                        id="password3"
                        type={showPassword3 ? "text" : "password"}
                        placeholder="Enter step 3 password"
                        value={password3}
                        onChange={(e) => setPassword3(e.target.value)}
                        className="pr-10"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword3(!showPassword3)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword3 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Admin...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Create Admin User
                    </span>
                  )}
                </Button>
              </form>

              <p className="mt-6 text-xs text-muted-foreground text-center">
                The new admin will need to enter all 3 passwords in sequence to access the admin panel.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
