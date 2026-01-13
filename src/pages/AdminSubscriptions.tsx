import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Crown,
  Zap,
  Building2,
  Calendar,
  RefreshCw,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface SubscriptionMetrics {
  total_subscribers: number;
  active_subscribers: number;
  churned_this_month: number;
  new_this_month: number;
  mrr: number;
  arr: number;
  churn_rate: number;
  growth_rate: number;
  plan_breakdown: {
    plan: string;
    count: number;
    percentage: number;
  }[];
  mrr_trend: {
    month: string;
    mrr: number;
  }[];
  recent_subscriptions: {
    id: number;
    user_name: string;
    user_email: string;
    plan: string;
    status: string;
    frequency: string;
    renewal_date: string;
    created_at: string;
  }[];
}

const PLAN_COLORS = {
  Free: "#94a3b8",
  Pro: "#14b8a6",
  Enterprise: "#f59e0b",
};

export default function AdminSubscriptions() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/subscriptions/metrics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error("Failed to load metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPlanIcon = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "enterprise":
        return <Building2 className="w-4 h-4" />;
      case "pro":
        return <Crown className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-success/20 text-success border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Canceled
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/dashboard">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <h1 className="font-display text-xl font-bold">Subscription Metrics</h1>
            </div>
            <Button variant="outline" size="sm" onClick={loadMetrics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">
              Subscription Metrics
            </h1>
            <p className="text-muted-foreground">
              Monitor subscription health, MRR, churn, and growth
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Monthly Recurring Revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold text-primary">
                  {formatCurrency(metrics?.mrr || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ARR: {formatCurrency(metrics?.arr || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Active Subscribers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-display font-bold">
                  {metrics?.active_subscribers || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  +{metrics?.new_this_month || 0} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  {(metrics?.churn_rate || 0) > 5 ? (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-success" />
                  )}
                  Churn Rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-display font-bold ${
                    (metrics?.churn_rate || 0) > 5
                      ? "text-destructive"
                      : "text-success"
                  }`}
                >
                  {metrics?.churn_rate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics?.churned_this_month || 0} churned this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Growth Rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-display font-bold ${
                    (metrics?.growth_rate || 0) > 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {(metrics?.growth_rate || 0) > 0 ? "+" : ""}
                  {metrics?.growth_rate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Month-over-month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* MRR Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>MRR Trend</CardTitle>
                <CardDescription>
                  Monthly recurring revenue over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics?.mrr_trend || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        className="text-xs fill-muted-foreground"
                      />
                      <YAxis
                        className="text-xs fill-muted-foreground"
                        tickFormatter={(value) => `R${value / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatCurrency(value), "MRR"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="mrr"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Plan Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>Active subscribers by plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics?.plan_breakdown || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="plan"
                      >
                        {metrics?.plan_breakdown?.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              PLAN_COLORS[entry.plan as keyof typeof PLAN_COLORS] ||
                              "#94a3b8"
                            }
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
                </div>
                <div className="space-y-2 mt-4">
                  {metrics?.plan_breakdown?.map((item) => (
                    <div key={item.plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              PLAN_COLORS[item.plan as keyof typeof PLAN_COLORS] ||
                              "#94a3b8",
                          }}
                        />
                        <span className="text-sm">{item.plan}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Subscriptions</CardTitle>
              <CardDescription>
                Latest subscription activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Renewal</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics?.recent_subscriptions?.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.user_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sub.user_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPlanIcon(sub.plan)}
                          <span>{sub.plan}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell className="capitalize">
                        {sub.frequency || "Monthly"}
                      </TableCell>
                      <TableCell>
                        {sub.renewal_date ? formatDate(sub.renewal_date) : "-"}
                      </TableCell>
                      <TableCell>{formatDate(sub.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="flex justify-start">
            <Button variant="outline" asChild>
              <Link to="/admin/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
