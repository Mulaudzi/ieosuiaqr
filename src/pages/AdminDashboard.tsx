import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminApi, AuditLog, AuditStats } from "@/services/api/admin";
import {
  Shield,
  Mail,
  Settings,
  BarChart3,
  Users,
  FileText,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LogOut,
  Loader2,
  ArrowRight,
  FlaskConical,
} from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalEmails: number;
  unreadEmails: number;
  totalAdmins: number;
  recentLogins: number;
  failedAttempts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isValidSession, isChecking, sessionExpired, clearAdminSession } = useAdminSession();

  useEffect(() => {
    // Only redirect if session check is complete and explicitly invalid
    if (!isChecking && isValidSession === false) {
      navigate("/admin/login", { replace: true });
    }
  }, [isChecking, isValidSession, navigate]);

  useEffect(() => {
    if (isValidSession) {
      fetchDashboardData();
    }
  }, [isValidSession]);

  const fetchDashboardData = async () => {
    try {
      // Fetch audit stats and recent activity in parallel
      const [auditStatsRes, auditLogsRes, adminsRes] = await Promise.all([
        adminApi.getAuditStats(),
        adminApi.getAuditLogs({ per_page: 10 }),
        adminApi.listAdmins()
      ]);

      if (auditStatsRes.success && auditStatsRes.data) {
        setAuditStats(auditStatsRes.data);
      }

      if (auditLogsRes.data) {
        setRecentActivity(auditLogsRes.data);
      }

      // Calculate dashboard stats
      const loginSuccesses = auditStatsRes.data?.by_status?.find(s => s.status === 'success')?.count || 0;
      const loginFailures = auditStatsRes.data?.by_status?.find(s => s.status === 'failure')?.count || 0;
      
      setStats({
        totalEmails: 0, // Would need separate endpoint
        unreadEmails: 0,
        totalAdmins: adminsRes.data?.admins?.length || 0,
        recentLogins: loginSuccesses,
        failedAttempts: loginFailures
      });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    toast({
      title: "Logged Out",
      description: "You have been logged out of the admin panel."
    });
    navigate("/admin/login", { replace: true });
  };

  const navItems = [
    {
      title: "Email Management",
      description: "View and manage contact form submissions",
      icon: Mail,
      href: "/admin/emails",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Admin Users",
      description: "Manage administrator accounts",
      icon: Users,
      href: "/admin/users",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Settings",
      description: "Configure notification and alert settings",
      icon: Settings,
      href: "/admin/settings",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      title: "Statistics",
      description: "View email and submission analytics",
      icon: BarChart3,
      href: "/admin/stats",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Audit Log",
      description: "Review all administrative actions",
      icon: FileText,
      href: "/admin/audit",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "QA Console",
      description: "System diagnostics and testing",
      icon: FlaskConical,
      href: "/admin/qa",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failure':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Success</Badge>;
      case 'failure':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Failed</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Warning</Badge>;
    }
  };

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">
                System overview and quick access
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Admins</p>
                    <p className="text-2xl font-bold">{stats?.totalAdmins || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-500" />
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
                    <p className="text-sm text-muted-foreground">Successful Logins</p>
                    <p className="text-2xl font-bold text-green-600">{stats?.recentLogins || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
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
                    <p className="text-sm text-muted-foreground">Failed Attempts</p>
                    <p className="text-2xl font-bold text-destructive">{stats?.failedAttempts || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
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
                    <p className="text-sm text-muted-foreground">Activity Today</p>
                    <p className="text-2xl font-bold">
                      {auditStats?.activity_by_day?.[auditStats.activity_by_day.length - 1]?.count || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation Cards */}
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-lg mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Link to={item.href}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                            <item.icon className={`w-5 h-5 ${item.color}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Recent Activity</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/audit">View All</Link>
              </Button>
            </div>
            <Card>
              <CardContent className="pt-6">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 8).map((log) => (
                      <div key={log.id} className="flex items-start gap-3">
                        {getStatusIcon(log.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {log.action}
                            </span>
                            {getStatusBadge(log.status)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "MMM d, h:mm a")}
                            </span>
                          </div>
                          {log.admin_email && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {log.admin_email}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Failures Alert */}
            {auditStats?.recent_failures && auditStats.recent_failures.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4"
              >
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      Recent Failed Attempts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {auditStats.recent_failures.slice(0, 3).map((failure) => (
                        <div key={failure.id} className="text-xs">
                          <span className="text-muted-foreground">
                            {format(new Date(failure.created_at), "MMM d, h:mm a")}
                          </span>
                          <span className="mx-2">·</span>
                          <span>{failure.admin_email || "Unknown"}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
