import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Plus,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  Filter,
  Grid3X3,
  List,
  ExternalLink,
  Eye,
  Pencil,
  Trash2,
  Download,
  Crown,
  TrendingUp,
  Users,
  Globe,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data
const qrCodes = [
  {
    id: "1",
    name: "Website Homepage",
    type: "URL",
    url: "https://ieosuia.com",
    scans: 1247,
    created: "2024-01-15",
    status: "active",
  },
  {
    id: "2",
    name: "Product Catalog PDF",
    type: "URL",
    url: "https://ieosuia.com/catalog.pdf",
    scans: 532,
    created: "2024-01-12",
    status: "active",
  },
  {
    id: "3",
    name: "Contact vCard",
    type: "vCard",
    url: "BEGIN:VCARD...",
    scans: 89,
    created: "2024-01-10",
    status: "active",
  },
  {
    id: "4",
    name: "Guest WiFi",
    type: "WiFi",
    url: "WIFI:T:WPA;S:GuestNetwork;P:password123;;",
    scans: 234,
    created: "2024-01-08",
    status: "active",
  },
];

const stats = [
  {
    label: "Total QR Codes",
    value: "4",
    limit: "5",
    icon: QrCode,
    color: "primary",
  },
  {
    label: "Total Scans",
    value: "2,102",
    change: "+12.5%",
    icon: TrendingUp,
    color: "success",
  },
  {
    label: "Unique Users",
    value: "1,847",
    change: "+8.3%",
    icon: Users,
    color: "accent",
  },
  {
    label: "Countries",
    value: "23",
    change: "+2",
    icon: Globe,
    color: "warning",
  },
];

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredQRCodes = qrCodes.filter((qr) =>
    qr.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:block">
        <div className="p-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">
              <span className="gradient-text">IEOSUIA</span>
            </span>
          </Link>

          {/* Nav Items */}
          <nav className="space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium"
            >
              <QrCode className="w-5 h-5" />
              My QR Codes
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

        {/* Upgrade Banner */}
        <div className="absolute bottom-24 left-4 right-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Get unlimited QR codes and advanced analytics
            </p>
            <Button variant="hero" size="sm" className="w-full" asChild>
              <Link to="/pricing">Upgrade Now</Link>
            </Button>
          </div>
        </div>

        {/* User Menu */}
        <div className="absolute bottom-4 left-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">JD</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">Free Plan</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="font-display text-2xl font-bold">My QR Codes</h1>
              <p className="text-sm text-muted-foreground">
                Manage and track all your QR codes
              </p>
            </div>
            <Button variant="hero" asChild>
              <Link to="/dashboard/create">
                <Plus className="w-5 h-5 mr-2" />
                Create QR Code
              </Link>
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-5 rounded-2xl bg-card border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      stat.color === "primary"
                        ? "bg-primary/10 text-primary"
                        : stat.color === "success"
                        ? "bg-success/10 text-success"
                        : stat.color === "accent"
                        ? "bg-accent/10 text-accent"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    <stat.icon className="w-5 h-5" />
                  </div>
                  {stat.change && (
                    <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">
                  {stat.label}
                  {stat.limit && (
                    <span className="text-primary"> / {stat.limit}</span>
                  )}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search QR codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <div className="flex items-center border border-border rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* QR Codes Grid */}
          {viewMode === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredQRCodes.map((qr, index) => (
                <motion.div
                  key={qr.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        qr.type === "URL"
                          ? "bg-primary/10 text-primary"
                          : qr.type === "vCard"
                          ? "bg-accent/10 text-accent"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {qr.type}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="bg-muted rounded-xl p-4 mb-4 flex items-center justify-center">
                    <QRCodeSVG
                      value={qr.url}
                      size={120}
                      level="M"
                      className="w-full h-auto max-w-[120px]"
                    />
                  </div>

                  <h3 className="font-semibold mb-1 truncate">{qr.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3 truncate flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {qr.url.length > 25 ? `${qr.url.slice(0, 25)}...` : qr.url}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {qr.scans.toLocaleString()} scans
                    </span>
                    <span className="text-muted-foreground">{qr.created}</span>
                  </div>
                </motion.div>
              ))}

              {/* Add New Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: filteredQRCodes.length * 0.05 }}
              >
                <Link
                  to="/dashboard/create"
                  className="flex flex-col items-center justify-center h-full min-h-[280px] p-5 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <Plus className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Create New QR Code
                  </span>
                </Link>
              </motion.div>
            </div>
          ) : (
            // List View
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      QR Code
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Scans
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredQRCodes.map((qr) => (
                    <tr key={qr.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <QRCodeSVG value={qr.url} size={40} />
                          </div>
                          <div>
                            <p className="font-medium">{qr.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {qr.url}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            qr.type === "URL"
                              ? "bg-primary/10 text-primary"
                              : qr.type === "vCard"
                              ? "bg-accent/10 text-accent"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          {qr.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {qr.scans.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {qr.created}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
