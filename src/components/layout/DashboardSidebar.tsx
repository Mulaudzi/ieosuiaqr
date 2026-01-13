import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useToast } from "@/hooks/use-toast";
import {
  QrCode,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Crown,
  Package,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  to: string;
  icon: React.ElementType;
  label: string;
  matchExact?: boolean;
};

// Allowed email for QA access
const QA_ALLOWED_EMAIL = "vendaboy.lm@gmail.com";

const getNavItems = (userEmail: string | undefined): NavItem[] => {
  const baseItems: NavItem[] = [
    { to: "/dashboard", icon: QrCode, label: "My QR Codes", matchExact: true },
    { to: "/dashboard/inventory", icon: Package, label: "Inventory" },
    { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  ];
  
  // Only show QA for allowed email
  if (userEmail === QA_ALLOWED_EMAIL) {
    baseItems.push({ to: "/dashboard/qa", icon: Shield, label: "QA & Debug" });
  }
  
  baseItems.push(
    { to: "/dashboard/profile", icon: User, label: "Profile" },
    { to: "/dashboard/settings", icon: Settings, label: "Settings" }
  );
  
  return baseItems;
};

interface DashboardSidebarProps {
  activeTab?: "qr" | "inventory";
  onTabChange?: (tab: "qr" | "inventory") => void;
}

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { plan } = useUserPlan();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userName = user?.name || "User";
  const userEmail = user?.email;
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const planLabel = plan === "free" ? "Free Plan" : plan === "pro" ? "Pro Plan" : "Enterprise";

  const navItems = getNavItems(userEmail);

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

  const isActive = (item: NavItem) => {
    if (item.matchExact) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  // For dashboard page with tabs
  const isDashboardPage = location.pathname === "/dashboard";

  return (
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

        <nav className="space-y-1" data-tutorial="sidebar-nav">
          {isDashboardPage && onTabChange ? (
            // Dashboard page with tab switching
            <>
              <button
                onClick={() => onTabChange("qr")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === "qr"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <QrCode className="w-5 h-5" />
                My QR Codes
              </button>
              <button
                onClick={() => onTabChange("inventory")}
                data-tutorial="inventory-nav"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === "inventory"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Package className="w-5 h-5" />
                Inventory
              </button>
              {navItems.slice(2).map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  data-tutorial={item.to === "/dashboard/analytics" ? "analytics-nav" : undefined}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </>
          ) : (
            // Other pages with link-based navigation
            navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                data-tutorial={item.to === "/dashboard/analytics" ? "analytics-nav" : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive(item)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))
          )}
        </nav>
      </div>

      {plan === "free" && (
        <div className="absolute bottom-24 left-4 right-4" data-tutorial="upgrade">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Get more QR codes and advanced analytics
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
  );
}
