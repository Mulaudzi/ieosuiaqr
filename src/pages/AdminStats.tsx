import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Shield,
  Mail,
  ArrowLeft,
  LogOut,
  MessageSquare,
  CheckCheck,
  Clock,
  TrendingUp,
  Send,
  XCircle,
  AlertCircle,
  RefreshCw,
  BarChart3,
  PieChartIcon,
} from "lucide-react";

interface EmailStats {
  period_days: number;
  totals: {
    all_emails: number;
    contact_submissions: number;
    replied: number;
    delivered: number;
    failed: number;
    bounced: number;
  };
  metrics: {
    response_rate: number;
    avg_response_hours: number | null;
    delivery_rate: number;
  };
  charts: {
    daily: Array<{ date: string; total: number; contacts: number; replied: number }>;
    by_purpose: Array<{ inquiry_purpose: string; count: number }>;
    by_hour: Array<{ hour: number; count: number }>;
  };
  recent_activity: Array<{
    id: number;
    sender_name: string;
    sender_email: string;
    inquiry_purpose: string;
    is_read: boolean;
    is_replied: boolean;
    created_at: string;
  }>;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminStats() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const { toast } = useToast();
  const navigate = useNavigate();

  const adminToken = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin");
      return;
    }
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const verifyRes = await fetch(`/api/admin/verify?admin_token=${adminToken}`);
      if (!verifyRes.ok) {
        localStorage.removeItem("admin_token");
        navigate("/admin");
        return;
      }

      const response = await fetch(`/api/admin/stats?days=${period}`, {
        headers: { Authorization: `Admin ${adminToken}` },
      });

      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load statistics.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { Authorization: `Admin ${adminToken}` },
      });
    } catch { /* ignore */ }
    localStorage.removeItem("admin_token");
    navigate("/admin");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
  };

  const formatResponseTime = (hours: number | null) => {
    if (hours === null) return "N/A";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Email Statistics</h1>
              <p className="text-xs text-muted-foreground">Analytics & insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/emails">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Emails
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {stats && (
          <div className="space-y-8">
            {/* Period Selector */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Overview</h2>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{stats.totals.contact_submissions}</p>
                    <p className="text-xs text-muted-foreground">Contact Submissions</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCheck className="w-4 h-4 text-success" />
                    </div>
                    <p className="text-2xl font-bold">{stats.totals.replied}</p>
                    <p className="text-xs text-muted-foreground">Replied</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-success/5 border-success/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                    </div>
                    <p className="text-2xl font-bold text-success">{stats.metrics.response_rate}%</p>
                    <p className="text-xs text-muted-foreground">Response Rate</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-2xl font-bold">{formatResponseTime(stats.metrics.avg_response_hours)}</p>
                    <p className="text-xs text-muted-foreground">Avg Response Time</p>
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
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{stats.metrics.delivery_rate}%</p>
                    <p className="text-xs text-muted-foreground">Delivery Rate</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{stats.totals.all_emails}</p>
                    <p className="text-xs text-muted-foreground">Total Emails</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Daily Submissions Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="w-4 h-4" />
                      Daily Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stats.charts.daily}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <YAxis
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="contacts"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={false}
                            name="Contacts"
                          />
                          <Line
                            type="monotone"
                            dataKey="replied"
                            stroke="hsl(var(--success))"
                            strokeWidth={2}
                            dot={false}
                            name="Replied"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* By Purpose Pie Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <PieChartIcon className="w-4 h-4" />
                      Submissions by Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center">
                      {stats.charts.by_purpose.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.charts.by_purpose}
                              dataKey="count"
                              nameKey="inquiry_purpose"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ inquiry_purpose, percent }) =>
                                `${inquiry_purpose} (${(percent * 100).toFixed(0)}%)`
                              }
                              labelLine={false}
                            >
                              {stats.charts.by_purpose.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-muted-foreground text-center w-full">No data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Hourly Distribution & Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* By Hour Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="w-4 h-4" />
                      Submissions by Hour
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.charts.by_hour}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis
                            dataKey="hour"
                            tickFormatter={(h) => `${h}:00`}
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <YAxis
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value) => [value, "Submissions"]}
                          />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquare className="w-4 h-4" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {stats.recent_activity.map((item) => (
                        <Link
                          key={item.id}
                          to="/admin/emails"
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.is_read ? "bg-muted" : "bg-primary"}`} />
                            <div className="min-w-0">
                              <p className={`text-sm truncate ${item.is_read ? "" : "font-medium"}`}>
                                {item.sender_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {item.inquiry_purpose}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {item.is_replied && (
                              <Badge variant="outline" className="text-success border-success/30 text-xs">
                                <CheckCheck className="w-3 h-3 mr-1" />
                                Replied
                              </Badge>
                            )}
                          </div>
                        </Link>
                      ))}
                      {stats.recent_activity.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Delivery Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Delivery Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl bg-success/10">
                      <Send className="w-6 h-6 text-success mx-auto mb-2" />
                      <p className="text-2xl font-bold text-success">{stats.totals.delivered}</p>
                      <p className="text-sm text-muted-foreground">Delivered</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-destructive/10">
                      <XCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
                      <p className="text-2xl font-bold text-destructive">{stats.totals.failed}</p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-warning/10">
                      <AlertCircle className="w-6 h-6 text-warning mx-auto mb-2" />
                      <p className="text-2xl font-bold text-warning">{stats.totals.bounced}</p>
                      <p className="text-sm text-muted-foreground">Bounced</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
