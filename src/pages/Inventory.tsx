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
  Shield,
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
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

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
      <DashboardSidebar />

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
