import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminApi, AuditLog, AuditStats } from "@/services/api/admin";
import {
  FileText,
  Download,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Activity,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { format, subDays } from "date-fns";

const ACTION_LABELS: Record<string, string> = {
  login_success: "Login Success",
  login_failed: "Login Failed",
  login_step_passed: "Login Step Passed",
  logout: "Logout",
  admin_created: "Admin Created",
  admin_updated: "Admin Updated",
  admin_deleted: "Admin Deleted",
  admin_activated: "Admin Activated",
  admin_deactivated: "Admin Deactivated",
  admin_unlocked: "Admin Unlocked",
  settings_updated: "Settings Updated",
  audit_export: "Audit Export",
};

const CATEGORY_LABELS: Record<string, string> = {
  auth: "Authentication",
  admin_management: "Admin Management",
  settings: "Settings",
  system: "System",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  success: { label: "Success", icon: CheckCircle, color: "bg-success/10 text-success" },
  failure: { label: "Failed", icon: XCircle, color: "bg-destructive/10 text-destructive" },
  warning: { label: "Warning", icon: AlertTriangle, color: "bg-warning/10 text-warning" },
};

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isValidSession, isChecking } = useAdminSession();

  useEffect(() => {
    // Only redirect if session check is complete and explicitly invalid
    if (!isChecking && isValidSession === false) {
      navigate("/admin/login", { replace: true });
    }
  }, [isChecking, isValidSession, navigate]);

  useEffect(() => {
    if (isValidSession) {
      fetchData();
    }
  }, [isValidSession, currentPage, categoryFilter, statusFilter, fromDate, toDate]);

  const fetchData = async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        adminApi.getAuditLogs({
          page: currentPage,
          per_page: 25,
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
        }),
        adminApi.getAuditStats()
      ]);

      if (logsRes.data) {
        setLogs(logsRes.data);
        setTotalPages(logsRes.meta?.last_page || 1);
        setTotalLogs(logsRes.meta?.total || 0);
      }

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch audit data:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load audit logs"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleExport = () => {
    const url = adminApi.getAuditExportUrl(fromDate, toDate);
    window.open(url, "_blank");
  };

  const resetFilters = () => {
    setCategoryFilter("");
    setStatusFilter("");
    setFromDate(format(subDays(new Date(), 7), "yyyy-MM-dd"));
    setToDate(format(new Date(), "yyyy-MM-dd"));
    setCurrentPage(1);
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
        <AdminBreadcrumb />
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Audit Log
            </h1>
            <p className="text-muted-foreground text-sm">
              Security and activity tracking for compliance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalLogs}</p>
                    <p className="text-xs text-muted-foreground">Total Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {stats.by_status.find(s => s.status === "success")?.count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Successful (30d)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {stats.by_status.find(s => s.status === "failure")?.count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Failed (30d)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {stats.activity_by_day.reduce((sum, d) => sum + d.count, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Last 7 Days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="admin_management">Admin Management</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failed</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-[140px]"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-[140px]"
                />
              </div>

              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Showing {logs.length} of {totalLogs} events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const statusConfig = STATUS_CONFIG[log.status] || STATUS_CONFIG.success;
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.admin_email || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[log.category] || log.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.target_name || log.target_type || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {log.ip_address || "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No audit logs found for the selected filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Failures Card */}
        {stats && stats.recent_failures.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="w-5 h-5" />
                Recent Failed Actions
              </CardTitle>
              <CardDescription>
                Last 10 failed actions requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recent_failures.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <div>
                        <p className="text-sm font-medium">{ACTION_LABELS[log.action] || log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.admin_email || "Unknown"} • {log.ip_address}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
