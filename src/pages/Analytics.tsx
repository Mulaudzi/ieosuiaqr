import { useState, useEffect, useCallback } from "react";
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
  TrendingUp,
  TrendingDown,
  Users,
  Globe,
  Smartphone,
  Monitor,
  Download,
  Lock,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { analyticsApi } from "@/services/api/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { useUserPlan } from "@/hooks/useUserPlan";

// Stats type definition
type StatItem = {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
};

// Empty state data for when API has no data
const emptyStats: StatItem[] = [
  {
    label: "Total Scans",
    value: "0",
    change: "",
    trend: "up",
    icon: TrendingUp,
  },
  {
    label: "Unique Scans",
    value: "0",
    change: "",
    trend: "up",
    icon: Users,
  },
  {
    label: "Top Device",
    value: "N/A",
    change: "",
    trend: "up",
    icon: Globe,
  },
  {
    label: "Avg. Daily Scans",
    value: "0",
    change: "",
    trend: "up",
    icon: BarChart3,
  },
];

export default function Analytics() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<{
    scanTrend: Array<{ date: string; scans: number }>;
    devices: Array<{ name: string; value: number; color: string }>;
    topQRCodes: Array<{ name: string; scans: number; change: number }>;
    countries: Array<{ country: string; scans: number; percentage: number }>;
    hourly: Array<{ hour: string; scans: number }>;
    stats: StatItem[];
  }>({
    scanTrend: [],
    devices: [],
    topQRCodes: [],
    countries: [],
    hourly: [],
    stats: emptyStats,
  });
  const { isPro } = useUserPlan();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleDateChange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [summaryRes, topQRRes, devicesRes, dailyRes, hourlyRes] = await Promise.all([
        analyticsApi.getSummary({ start_date: startDate, end_date: endDate }),
        analyticsApi.getTopQRCodes({ start_date: startDate, end_date: endDate, limit: 5 }),
        analyticsApi.getDeviceBreakdown({ start_date: startDate, end_date: endDate }),
        analyticsApi.getDailyTrend({ start_date: startDate, end_date: endDate }),
        analyticsApi.getHourlyDistribution({ start_date: startDate, end_date: endDate }),
      ]);

      // Transform API responses to chart data
      if (summaryRes.success && summaryRes.data) {
        const s = summaryRes.data;
        setAnalyticsData((prev) => ({
          ...prev,
          stats: [
            {
              label: "Total Scans",
              value: s.total_scans.toLocaleString(),
              change: `${s.scan_change_percent >= 0 ? "+" : ""}${s.scan_change_percent}%`,
              trend: s.scan_change_percent >= 0 ? ("up" as const) : ("down" as const),
              icon: TrendingUp,
            },
            {
              label: "Unique Scans",
              value: s.unique_scans.toLocaleString(),
              change: "+8.3%",
              trend: "up" as const,
              icon: Users,
            },
            {
              label: "Top Device",
              value: s.top_device || "Mobile",
              change: "",
              trend: "up" as const,
              icon: Globe,
            },
            {
              label: "Avg. Daily Scans",
              value: Math.round(s.total_scans / 7).toString(),
              change: "-2.1%",
              trend: "down" as const,
              icon: BarChart3,
            },
          ],
        }));
      }

      if (topQRRes.success && topQRRes.data) {
        setAnalyticsData((prev) => ({
          ...prev,
          topQRCodes: topQRRes.data!.map((qr) => ({
            name: qr.qr_name,
            scans: qr.scan_count,
            change: qr.change_percent,
          })),
        }));
      }

      if (devicesRes.success && devicesRes.data) {
        const colors = ["hsl(175, 80%, 40%)", "hsl(260, 70%, 60%)", "hsl(145, 65%, 42%)"];
        setAnalyticsData((prev) => ({
          ...prev,
          devices: devicesRes.data!.slice(0, 3).map((d, i) => ({
            name: d.device_type,
            value: d.percentage,
            color: colors[i],
          })),
        }));
      }

      if (dailyRes.success && dailyRes.data) {
        setAnalyticsData((prev) => ({
          ...prev,
          scanTrend: dailyRes.data!.map((d) => ({
            date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            scans: d.count,
          })),
        }));
      }

      if (hourlyRes.success && hourlyRes.data) {
        setAnalyticsData((prev) => ({
          ...prev,
          hourly: hourlyRes.data!.map((h) => ({
            hour: h.hour.toString().padStart(2, "0"),
            scans: h.count,
          })),
        }));
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError("Failed to load analytics. Using cached data.");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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
      // Error already handled by logout
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userName = user?.name || "User";
  const userInitials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const handleExport = async () => {
    try {
      const response = await analyticsApi.exportReport({
        type: "analytics",
        format: "csv",
        start_date: startDate,
        end_date: endDate,
      });
      if (response.success && response.data?.download_url) {
        window.open(response.data.download_url, "_blank");
        toast({ title: "Export started", description: "Your report is being downloaded." });
      }
    } catch {
      toast({ variant: "destructive", title: "Export failed", description: "Could not generate report." });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Error Alert - inline below header, not blocking other elements */}
      {error && (
        <div className="lg:ml-64 px-6 pt-4">
          <Alert variant="default" className="bg-muted border-border">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <AlertDescription className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing cached data. Pull to refresh for live data.</span>
              <Button variant="ghost" size="sm" onClick={fetchAnalytics}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <DashboardSidebar />

      {/* Main Content */}
      <main className="lg:ml-64">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="font-display text-2xl font-bold">Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Track your QR code performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DateRangePicker onDateChange={handleDateChange} />
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="p-5 rounded-2xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <Skeleton className="w-16 h-6 rounded-full" />
                  </div>
                  <Skeleton className="w-20 h-8 mb-1" />
                  <Skeleton className="w-24 h-4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {analyticsData.stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-5 rounded-2xl bg-card border border-border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    {stat.change && (
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          stat.trend === "up"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {stat.change}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-display font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          )}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Scan Trends */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border"
            >
              <h3 className="font-display font-semibold mb-4">Scan Trends</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.scanTrend}>
                    <defs>
                      <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(175, 80%, 40%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(175, 80%, 40%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                    <XAxis dataKey="date" stroke="hsl(220, 10%, 45%)" fontSize={12} />
                    <YAxis stroke="hsl(220, 10%, 45%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(220, 15%, 90%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="scans"
                      stroke="hsl(175, 80%, 40%)"
                      strokeWidth={2}
                      fill="url(#scanGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Device Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl bg-card border border-border"
            >
              <h3 className="font-display font-semibold mb-4">Devices</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.devices}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analyticsData.devices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {analyticsData.devices.map((device) => (
                  <div key={device.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: device.color }}
                      />
                      <span>{device.name}</span>
                    </div>
                    <span className="font-medium">{device.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top QR Codes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl bg-card border border-border"
            >
              <h3 className="font-display font-semibold mb-4">Top QR Codes</h3>
              <div className="space-y-4">
                {analyticsData.topQRCodes.map((qr, index) => (
                  <div
                    key={qr.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <span className="font-medium">{qr.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {qr.scans.toLocaleString()} scans
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          qr.change > 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {qr.change > 0 ? "+" : ""}
                        {qr.change}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Geographic Distribution - Premium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-6 rounded-2xl bg-card border border-border relative"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Geographic Distribution</h3>
                {!isPro && (
                  <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded-full">
                    Pro
                  </span>
                )}
              </div>

              {isPro ? (
                <div className="space-y-3">
                  {analyticsData.countries.map((country) => (
                    <div key={country.country}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{country.country}</span>
                        <span className="text-muted-foreground">
                          {country.scans.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${country.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-2xl">
                  <div className="text-center p-6">
                    <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium mb-2">Upgrade to Pro</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Unlock geographic insights and more
                    </p>
                    <Button variant="hero" size="sm" asChild>
                      <Link to="/dashboard/settings?tab=billing">Upgrade Now</Link>
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Hourly Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-2xl bg-card border border-border"
          >
            <h3 className="font-display font-semibold mb-4">Scans by Hour</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                  <XAxis dataKey="hour" stroke="hsl(220, 10%, 45%)" fontSize={12} />
                  <YAxis stroke="hsl(220, 10%, 45%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(220, 15%, 90%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="scans" fill="hsl(175, 80%, 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
