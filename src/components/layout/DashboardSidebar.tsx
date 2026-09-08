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
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Package,
  QrCode,
} from "lucide-react";
import { useState } from "react";
import ieosuiaLogo from "@/assets/ieosuia-qr-logo-blue.png";

type NavItem = {
  to: string;
  icon: React.ElementType;
  label: string;
  matchExact?: boolean;
};

const navItems: NavItem[] = [
  { to: "/dashboard", icon: QrCode, label: "My QR Codes", matchExact: true },
  { to: "/dashboard/inventory", icon: Package, label: "Inventory" },
  { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

interface DashboardSidebarProps {
  activeTab?: "qr" | "inventory";
  onTabChange?: (tab: "qr" | "inventory") => void;
}

export function DashboardSidebar({ activeTab, onTabChange }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userName = user?.name || "User";
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

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

  return (<>
    <nav
      aria-label="Dashboard navigation"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-border bg-card/95 px-2 pt-2 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {navItems.map((item) => {
        const dashboardTab = isDashboardPage && onTabChange;
        const active = item.to === "/dashboard"
          ? dashboardTab ? activeTab === "qr" : isActive(item)
          : item.to === "/dashboard/inventory" && dashboardTab
            ? activeTab === "inventory"
            : isActive(item);
        const label = item.label === "My QR Codes" ? "QR Codes" : item.label;
        const classes = `flex min-w-0 min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors ${
          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
        }`;

        if (dashboardTab && item.to === "/dashboard/inventory") {
          return <button type="button" key={item.to} onClick={() => onTabChange("inventory")} className={classes} aria-current={active ? "page" : undefined}><item.icon className="h-5 w-5" /><span className="truncate">{label}</span></button>;
        }
        return <Link key={item.to} to={item.to} onClick={dashboardTab && item.to === "/dashboard" ? () => onTabChange("qr") : undefined} className={classes} aria-current={active ? "page" : undefined}><item.icon className="h-5 w-5" /><span className="truncate">{label}</span></Link>;
      })}
    </nav>
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:block">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <img src={ieosuiaLogo} alt="IEOSUIA QR" className="h-9 w-auto" />
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

      <div className="absolute bottom-4 left-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{userInitials}</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">Free Forever</p>
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
    </>
  );
}
