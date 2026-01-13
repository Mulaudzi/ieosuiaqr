import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Package,
  TrendingUp,
  QrCode,
  Activity,
  ArrowLeft,
  CheckCircle,
  LogOut,
  Wrench,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChartIcon,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { inventoryApi, InventoryAnalytics } from "@/services/api/inventory";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  in_stock: "hsl(142, 76%, 36%)",
  out: "hsl(0, 84%, 60%)",
  maintenance: "hsl(45, 93%, 47%)",
  checked_out: "hsl(217, 91%, 60%)",
};

const statusIcons: Record<string, React.ElementType> = {
  in_stock: CheckCircle,
  out: LogOut,
  maintenance: Wrench,
  checked_out: AlertTriangle,
};

const categoryColors = [
  "hsl(175, 80%, 40%)",
  "hsl(217, 91%, 60%)",
  "hsl(142, 76%, 36%)",
  "hsl(45, 93%, 47%)",
  "hsl(280, 87%, 65%)",
  "hsl(0, 84%, 60%)",
  "hsl(200, 95%, 50%)",
  "hsl(320, 80%, 55%)",
];

export default function InventoryAnalyticsPage() {
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await inventoryApi.getAnalytics(period);
        if (response.data) {
          setAnalytics(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container max-w-7xl mx-auto py-8 px-4">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md text-center p-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Analytics Data</h2>
            <p className="text-muted-foreground mb-4">
              Start adding inventory items to see analytics.
            </p>
            <Button asChild>
              <Link to="/dashboard/inventory">Go to Inventory</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const statusPieData = analytics.status_distribution.map((item) => ({
    name: item.label,
    value: item.count,
    fill: statusColors[item.status] || "hsl(220, 10%, 50%)",
  }));

  const categoryPieData = analytics.by_category.map((item, index) => ({
    name: item.category,
    value: item.count,
    fill: categoryColors[index % categoryColors.length],
  }));

  const scanTrendData = analytics.scan_trend.map((item) => ({
    date: format(new Date(item.date), "MMM d"),
    scans: item.scans,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Link
              to="/dashboard/inventory"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Inventory
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-primary" />
              Inventory Analytics
            </h1>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-3xl font-bold">{analytics.summary.total_items}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Scans</p>
                    <p className="text-3xl font-bold">{analytics.summary.total_scans}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">With QR Code</p>
                    <p className="text-3xl font-bold">{analytics.summary.items_with_qr}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Without QR</p>
                    <p className="text-3xl font-bold">{analytics.summary.items_without_qr}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  Status Distribution
                </CardTitle>
                <CardDescription>Current status of all inventory items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  {statusPieData.every(d => d.value === 0) ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No items to display
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {statusPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {analytics.status_distribution.map((item) => {
                    const Icon = statusIcons[item.status] || Package;
                    return (
                      <div key={item.status} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: statusColors[item.status] }}
                        />
                        <Icon className="h-4 w-4" style={{ color: statusColors[item.status] }} />
                        <span>{item.label}: {item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Items by Category
                </CardTitle>
                <CardDescription>Distribution across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  {categoryPieData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No categories to display
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryPieData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={100}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {categoryPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Scan Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Scan Frequency
              </CardTitle>
              <CardDescription>Daily scans of inventory items over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {scanTrendData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No scan data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scanTrendData}>
                      <defs>
                        <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(175, 80%, 40%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(175, 80%, 40%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
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
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Most Active Items
                </CardTitle>
                <CardDescription>Items with the most scans</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.top_items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No scan activity yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.top_items.slice(0, 5).map((item, index) => {
                      const StatusIcon = statusIcons[item.status] || Package;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: statusColors[item.status], color: statusColors[item.status] }}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {item.status.replace("_", " ")}
                            </Badge>
                            <div className="text-right">
                              <p className="font-semibold text-sm">{item.scan_count}</p>
                              <p className="text-xs text-muted-foreground">scans</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Changes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Status Changes
                </CardTitle>
                <CardDescription>Latest item movements and updates</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.recent_changes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent changes
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.recent_changes.slice(0, 5).map((change) => {
                      const NewIcon = statusIcons[change.new_status] || Package;
                      return (
                        <div
                          key={change.id}
                          className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${statusColors[change.new_status]}20` }}
                            >
                              <NewIcon
                                className="h-4 w-4"
                                style={{ color: statusColors[change.new_status] }}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{change.item_name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {change.old_status && (
                                  <>
                                    <span className="capitalize">{change.old_status.replace("_", " ")}</span>
                                    <span>→</span>
                                  </>
                                )}
                                <span
                                  className="capitalize font-medium"
                                  style={{ color: statusColors[change.new_status] }}
                                >
                                  {change.new_status.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <p>{format(new Date(change.changed_at), "MMM d")}</p>
                            <p>{format(new Date(change.changed_at), "h:mm a")}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
