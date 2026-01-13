import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Crown,
  Package,
  ArrowLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { InventoryTab } from "@/components/inventory/InventoryTab";

export default function Inventory() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { plan } = useUserPlan();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({
        title: "Signed out",
        description: "You have been successfully logged out.",
      });
      navigate("/login");
    } catch {
      // Error already handled
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userName = user?.name || "User";
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const planLabel = plan === "free" ? "Free Plan" : plan === "pro" ? "Pro Plan" : "Enterprise";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:block">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">
              <span className="gradient-text">IEOSUIA</span>
            </span>
          </Link>

          <nav className="space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
            >
              <QrCode className="w-5 h-5" />
              My QR Codes
            </Link>
            <Link
              to="/dashboard/inventory"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium"
            >
              <Package className="w-5 h-5" />
              Inventory
            </Link>
            <Link
              to="/dashboard/analytics"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </Link>
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </nav>
        </div>

        {plan === "free" && (
          <div className="absolute bottom-24 left-4 right-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Get more inventory items and edit capabilities
              </p>
              <Button variant="hero" size="sm" className="w-full" asChild>
                <Link to="/dashboard/settings?tab=billing">Upgrade Now</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">{userInitials}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{planLabel}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  Inventory Tracking
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track products, assets, and equipment with smart QR codes
                </p>
              </div>
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6"
        >
          <InventoryTab />
        </motion.div>
      </main>
    </div>
  );
}
