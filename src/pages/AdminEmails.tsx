import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Shield,
  Mail,
  Search,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  MailOpen,
  Reply,
  Archive,
  MoreVertical,
  AlertCircle,
  Flag,
  Inbox,
  Send,
  CheckCheck,
  MailWarning,
  BarChart3,
  Settings,
  Download,
  FileText,
  TrendingUp,
} from "lucide-react";
import jsPDF from "jspdf";

interface EmailLog {
  id: number;
  recipient_email: string;
  cc_email: string | null;
  reply_to_email: string | null;
  subject: string;
  body_preview: string | null;
  email_type: string;
  status: string;
  error_message: string | null;
  sender_name: string | null;
  sender_email: string | null;
  sender_company: string | null;
  inquiry_purpose: string | null;
  origin_url: string | null;
  ip_address: string | null;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  is_replied: boolean;
  replied_at: string | null;
  reply_notes: string | null;
  priority: string;
  is_archived: boolean;
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  bounced: number;
  contact_forms: number;
  unread: number;
  unreplied: number;
  unread_contacts: number;
}

interface ChartData {
  date: string;
  contacts: number;
  replied: number;
  total: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  sent: { label: "Sent", color: "bg-success/10 text-success", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive", icon: XCircle },
  bounced: { label: "Bounced", color: "bg-warning/10 text-warning", icon: AlertCircle },
  pending: { label: "Pending", color: "bg-muted text-muted-foreground", icon: Clock },
};

const typeConfig: Record<string, { label: string; color: string }> = {
  contact: { label: "Contact Form", color: "bg-primary/10 text-primary" },
  verification: { label: "Verification", color: "bg-accent/10 text-accent" },
  password_reset: { label: "Password Reset", color: "bg-warning/10 text-warning" },
  welcome: { label: "Welcome", color: "bg-success/10 text-success" },
  notification: { label: "Notification", color: "bg-muted text-muted-foreground" },
  other: { label: "Other", color: "bg-muted text-muted-foreground" },
};

const priorityConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  low: { label: "Low", color: "text-muted-foreground", icon: Flag },
  normal: { label: "Normal", color: "text-foreground", icon: Flag },
  high: { label: "High", color: "text-warning", icon: Flag },
  urgent: { label: "Urgent", color: "text-destructive", icon: AlertCircle },
};

export default function AdminEmails() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [repliedFilter, setRepliedFilter] = useState("");
  const [archivedFilter, setArchivedFilter] = useState("false");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [replyNotes, setReplyNotes] = useState("");
  const [activeTab, setActiveTab] = useState("inbox");
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isValidSession, isChecking, clearAdminSession } = useAdminSession();

  const adminToken = localStorage.getItem("admin_token");

  useEffect(() => {
    if (isChecking) return;
    
    if (!isValidSession || !adminToken) {
      navigate("/login", { state: { adminRedirect: true }, replace: true });
      return;
    }
    verifyAndFetch();
  }, [page, statusFilter, typeFilter, readFilter, repliedFilter, archivedFilter, isChecking, isValidSession, adminToken]);

  const verifyAndFetch = async () => {
    if (!isValidSession || !adminToken) return;
    
    try {
      const verifyRes = await fetch(`/api/admin/verify?admin_token=${adminToken}`);
      if (!verifyRes.ok) {
        clearAdminSession();
        navigate("/login", { state: { adminRedirect: true }, replace: true });
        return;
      }
      await fetchEmails();
      await fetchChartData();
    } catch {
      navigate("/login", { state: { adminRedirect: true }, replace: true });
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await fetch(`/api/admin/stats?days=30`, {
        headers: { Authorization: `Admin ${adminToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setChartData(data.data.charts.daily || []);
      }
    } catch {
      // Silent fail for chart data
    }
  };

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "25",
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(search && { search }),
        ...(readFilter && { read: readFilter }),
        ...(repliedFilter && { replied: repliedFilter }),
        archived: archivedFilter,
      });

      const response = await fetch(`/api/admin/emails?${params}`, {
        headers: { Authorization: `Admin ${adminToken}` },
      });

      if (!response.ok) throw new Error("Failed to fetch emails");

      const data = await response.json();
      setEmails(data.data.logs);
      setStats(data.data.stats);
      setTotalPages(data.data.pagination.total_pages);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load email logs.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmails();
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

  const markAsRead = async (id: number, isRead: boolean) => {
    try {
      await fetch("/api/admin/emails/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Admin ${adminToken}`,
        },
        body: JSON.stringify({ id, is_read: isRead }),
      });
      toast({ title: isRead ? "Marked as read" : "Marked as unread" });
      fetchEmails();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    }
  };

  const markAsReplied = async (id: number, isReplied: boolean, notes?: string) => {
    try {
      await fetch("/api/admin/emails/replied", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Admin ${adminToken}`,
        },
        body: JSON.stringify({ id, is_replied: isReplied, notes }),
      });
      toast({ title: isReplied ? "Marked as replied" : "Marked as not replied" });
      setReplyNotes("");
      fetchEmails();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    }
  };

  const setPriority = async (id: number, priority: string) => {
    try {
      await fetch("/api/admin/emails/priority", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Admin ${adminToken}`,
        },
        body: JSON.stringify({ id, priority }),
      });
      toast({ title: "Priority updated" });
      fetchEmails();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update priority" });
    }
  };

  const archiveEmail = async (id: number, isArchived: boolean) => {
    try {
      await fetch("/api/admin/emails/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Admin ${adminToken}`,
        },
        body: JSON.stringify({ id, is_archived: isArchived }),
      });
      toast({ title: isArchived ? "Email archived" : "Email unarchived" });
      fetchEmails();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to archive" });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      toast({ title: "No emails selected" });
      return;
    }

    try {
      await fetch("/api/admin/emails/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Admin ${adminToken}`,
        },
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      toast({ title: "Bulk action completed" });
      setSelectedIds([]);
      fetchEmails();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to perform action" });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === emails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(emails.map((e) => e.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatChartDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
  };

  const exportToCsv = async () => {
    setIsExporting(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const params = new URLSearchParams({
        start_date: startDate.toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      });

      const response = await fetch(`/api/admin/export/emails?${params}`, {
        headers: { Authorization: `Admin ${adminToken}` },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `email_logs_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast({ title: "Export complete", description: "CSV file downloaded successfully." });
    } catch {
      toast({ variant: "destructive", title: "Export failed", description: "Could not generate CSV file." });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPdf = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/admin/export/stats?days=30&format=json`, {
        headers: { Authorization: `Admin ${adminToken}` },
      });

      if (!response.ok) throw new Error("Export failed");

      const data = await response.json();
      const report = data.data;

      const pdf = new jsPDF();
      const margin = 20;
      let y = margin;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(59, 130, 246);
      pdf.text("IEOSUIA QR - Email Statistics Report", margin, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Generated: ${report.report_date}`, margin, y);
      y += 5;
      pdf.text(`Period: ${report.period.start} to ${report.period.end} (${report.period.days} days)`, margin, y);
      y += 15;

      // Summary
      pdf.setFontSize(14);
      pdf.setTextColor(0);
      pdf.text("Summary", margin, y);
      y += 8;

      pdf.setFontSize(10);
      const summaryData = [
        ["Total Emails", report.summary.total_emails],
        ["Contact Submissions", report.summary.contact_submissions],
        ["Replied", report.summary.replied],
        ["Response Rate", `${report.summary.response_rate}%`],
        ["Avg Response Time", `${report.summary.avg_response_hours} hours`],
        ["Delivered", report.summary.delivered],
        ["Failed", report.summary.failed],
        ["Bounced", report.summary.bounced],
      ];

      summaryData.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, margin, y);
        y += 6;
      });
      y += 10;

      // By Purpose
      if (report.by_purpose.length > 0) {
        pdf.setFontSize(14);
        pdf.text("Submissions by Type", margin, y);
        y += 8;

        pdf.setFontSize(10);
        report.by_purpose.forEach((item: { inquiry_purpose: string; count: number }) => {
          pdf.text(`${item.inquiry_purpose}: ${item.count}`, margin, y);
          y += 6;
        });
      }

      pdf.save(`email_stats_report_${new Date().toISOString().split("T")[0]}.pdf`);
      toast({ title: "Export complete", description: "PDF report downloaded successfully." });
    } catch {
      toast({ variant: "destructive", title: "Export failed", description: "Could not generate PDF report." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailClick = async (email: EmailLog) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      await markAsRead(email.id, true);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedIds([]);
    
    switch (tab) {
      case "inbox":
        setArchivedFilter("false");
        setTypeFilter("contact");
        setReadFilter("");
        setRepliedFilter("");
        break;
      case "unread":
        setArchivedFilter("false");
        setTypeFilter("contact");
        setReadFilter("false");
        setRepliedFilter("");
        break;
      case "unreplied":
        setArchivedFilter("false");
        setTypeFilter("contact");
        setReadFilter("");
        setRepliedFilter("false");
        break;
      case "all":
        setArchivedFilter("false");
        setTypeFilter("");
        setReadFilter("");
        setRepliedFilter("");
        break;
      case "archived":
        setArchivedFilter("true");
        setTypeFilter("");
        setReadFilter("");
        setRepliedFilter("");
        break;
    }
  };

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
              <h1 className="font-bold text-lg">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Contact Emails & Logs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/stats">
                <BarChart3 className="w-4 h-4 mr-2" />
                Statistics
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
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
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-accent" />
              </div>
              <p className="text-xl font-bold">{stats.contact_forms}</p>
              <p className="text-xs text-muted-foreground">Contacts</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl bg-warning/5 border border-warning/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <MailWarning className="w-4 h-4 text-warning" />
              </div>
              <p className="text-xl font-bold text-warning">{stats.unread_contacts || 0}</p>
              <p className="text-xs text-muted-foreground">Unread</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Reply className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-xl font-bold text-destructive">{stats.unreplied || 0}</p>
              <p className="text-xs text-muted-foreground">Unreplied</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-success" />
              </div>
              <p className="text-xl font-bold">{stats.sent}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-xl font-bold">{stats.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-warning" />
              </div>
              <p className="text-xl font-bold">{stats.bounced}</p>
              <p className="text-xs text-muted-foreground">Bounced</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <MailOpen className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold">{(stats.total || 0) - (stats.unread || 0)}</p>
              <p className="text-xs text-muted-foreground">Read</p>
            </motion.div>
          </div>
        )}

        {/* Submission Trends Chart */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-4 h-4" />
                    Submission Trends (Last 30 Days)
                  </CardTitle>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isExporting}>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card">
                        <DropdownMenuItem onClick={exportToCsv}>
                          <FileText className="w-4 h-4 mr-2" />
                          Export Logs (CSV)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportToPdf}>
                          <FileText className="w-4 h-4 mr-2" />
                          Export Report (PDF)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorReplied" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatChartDate}
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        labelFormatter={(label) => formatChartDate(label)}
                      />
                      <Area
                        type="monotone"
                        dataKey="contacts"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorContacts)"
                        name="Contact Submissions"
                      />
                      <Area
                        type="monotone"
                        dataKey="replied"
                        stroke="hsl(var(--success))"
                        strokeWidth={2}
                        fill="url(#colorReplied)"
                        name="Replied"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">Contact Submissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-xs text-muted-foreground">Replied</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="w-4 h-4" />
              Inbox
              {stats && stats.unread_contacts > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {stats.unread_contacts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-2">
              <MailWarning className="w-4 h-4" />
              Unread
            </TabsTrigger>
            <TabsTrigger value="unreplied" className="gap-2">
              <Reply className="w-4 h-4" />
              Needs Reply
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Mail className="w-4 h-4" />
              All Emails
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              <Archive className="w-4 h-4" />
              Archived
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters & Bulk Actions */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, name, or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </form>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction("mark_read")}>
                <MailOpen className="w-4 h-4 mr-1" />
                Mark Read
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction("archive")}>
                <Archive className="w-4 h-4 mr-1" />
                Archive
              </Button>
            </div>
          )}

          <Button variant="outline" onClick={fetchEmails} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Email Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === emails.length && emails.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Status</TableHead>
                <TableHead>From / Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : emails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No emails found.
                  </TableCell>
                </TableRow>
              ) : (
                emails.map((email) => {
                  const status = statusConfig[email.status] || statusConfig.pending;
                  const type = typeConfig[email.email_type] || typeConfig.other;
                  const priority = priorityConfig[email.priority] || priorityConfig.normal;
                  const StatusIcon = status.icon;
                  const isUnread = !email.is_read;

                  return (
                    <TableRow
                      key={email.id}
                      className={`cursor-pointer hover:bg-muted/50 ${isUnread ? "bg-primary/5 font-medium" : ""}`}
                      onClick={() => handleEmailClick(email)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(email.id)}
                          onCheckedChange={() => toggleSelect(email.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" title={isUnread ? "Unread" : email.is_replied ? "Replied" : ""}>
                          {isUnread && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                          {email.is_replied && (
                            <CheckCheck className="w-4 h-4 text-success" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          {email.sender_name ? (
                            <>
                              <div className={`text-sm truncate ${isUnread ? "font-semibold" : ""}`}>
                                {email.sender_name}
                                {email.sender_company && (
                                  <span className="text-muted-foreground font-normal"> • {email.sender_company}</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{email.subject}</div>
                            </>
                          ) : (
                            <>
                              <div className={`text-sm truncate ${isUnread ? "font-semibold" : ""}`}>{email.recipient_email}</div>
                              <div className="text-xs text-muted-foreground truncate">{email.subject}</div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={type.color}>
                          {type.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={priority.color}>
                          {email.priority !== "normal" && (
                            <Flag className={`w-4 h-4 inline mr-1 ${email.priority === "urgent" ? "fill-current" : ""}`} />
                          )}
                          {priority.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(email.created_at)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card">
                            <DropdownMenuItem onClick={() => handleEmailClick(email)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => markAsRead(email.id, !email.is_read)}>
                              <MailOpen className="w-4 h-4 mr-2" />
                              {email.is_read ? "Mark Unread" : "Mark Read"}
                            </DropdownMenuItem>
                            {email.email_type === "contact" && (
                              <DropdownMenuItem onClick={() => markAsReplied(email.id, !email.is_replied)}>
                                <Reply className="w-4 h-4 mr-2" />
                                {email.is_replied ? "Mark Unreplied" : "Mark Replied"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setPriority(email.id, "high")}>
                              <Flag className="w-4 h-4 mr-2 text-warning" />
                              High Priority
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPriority(email.id, "urgent")}>
                              <AlertCircle className="w-4 h-4 mr-2 text-destructive" />
                              Urgent
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => archiveEmail(email.id, !email.is_archived)}>
                              <Archive className="w-4 h-4 mr-2" />
                              {email.is_archived ? "Unarchive" : "Archive"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Email Detail Modal */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Details
            </DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-6">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className={statusConfig[selectedEmail.status]?.color}>
                  {statusConfig[selectedEmail.status]?.label || selectedEmail.status}
                </Badge>
                <Badge variant="secondary" className={typeConfig[selectedEmail.email_type]?.color}>
                  {typeConfig[selectedEmail.email_type]?.label || selectedEmail.email_type}
                </Badge>
                {selectedEmail.is_read && (
                  <Badge variant="outline" className="gap-1">
                    <MailOpen className="w-3 h-3" />
                    Read
                  </Badge>
                )}
                {selectedEmail.is_replied && (
                  <Badge variant="outline" className="gap-1 text-success border-success/30">
                    <CheckCheck className="w-3 h-3" />
                    Replied
                  </Badge>
                )}
                {selectedEmail.priority !== "normal" && (
                  <Badge variant="outline" className={`gap-1 ${priorityConfig[selectedEmail.priority]?.color}`}>
                    <Flag className="w-3 h-3" />
                    {priorityConfig[selectedEmail.priority]?.label}
                  </Badge>
                )}
              </div>

              {/* Sender Info */}
              {selectedEmail.sender_name && (
                <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                  <p className="text-sm font-medium">Contact Information</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Name</p>
                      <p className="font-medium">{selectedEmail.sender_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Email</p>
                      <a href={`mailto:${selectedEmail.sender_email}`} className="font-medium text-primary hover:underline">
                        {selectedEmail.sender_email}
                      </a>
                    </div>
                    {selectedEmail.sender_company && (
                      <div>
                        <p className="text-muted-foreground text-xs">Company</p>
                        <p className="font-medium">{selectedEmail.sender_company}</p>
                      </div>
                    )}
                    {selectedEmail.inquiry_purpose && (
                      <div>
                        <p className="text-muted-foreground text-xs">Inquiry Type</p>
                        <p className="font-medium">{selectedEmail.inquiry_purpose}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subject */}
              <div>
                <p className="text-muted-foreground mb-1 text-xs">Subject</p>
                <p className="font-medium">{selectedEmail.subject}</p>
              </div>

              {/* Message */}
              {selectedEmail.body_preview && (
                <div>
                  <p className="text-muted-foreground mb-2 text-xs">Message</p>
                  <div className="p-4 rounded-xl bg-muted/50 text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedEmail.body_preview}
                  </div>
                </div>
              )}

              {/* Reply Notes */}
              {selectedEmail.is_replied && selectedEmail.reply_notes && (
                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <p className="text-sm font-medium text-success mb-2">Reply Notes</p>
                  <p className="text-sm">{selectedEmail.reply_notes}</p>
                  {selectedEmail.replied_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Replied on {formatDate(selectedEmail.replied_at)}
                    </p>
                  )}
                </div>
              )}

              {/* Error Message */}
              {selectedEmail.error_message && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive mb-1">Error</p>
                  <p className="text-sm text-destructive/80">{selectedEmail.error_message}</p>
                </div>
              )}

              {/* Mark as Replied Form */}
              {selectedEmail.email_type === "contact" && !selectedEmail.is_replied && (
                <div className="p-4 rounded-xl border border-border space-y-3">
                  <p className="text-sm font-medium">Mark as Replied</p>
                  <Textarea
                    placeholder="Add notes about your reply (optional)..."
                    value={replyNotes}
                    onChange={(e) => setReplyNotes(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={() => markAsReplied(selectedEmail.id, true, replyNotes)} className="w-full">
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark as Replied
                  </Button>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                {selectedEmail.sender_email && (
                  <Button asChild variant="default" size="sm">
                    <a href={`mailto:${selectedEmail.sender_email}?subject=Re: ${selectedEmail.inquiry_purpose || "Your inquiry"}`}>
                      <Reply className="w-4 h-4 mr-2" />
                      Reply via Email
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => archiveEmail(selectedEmail.id, !selectedEmail.is_archived)}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  {selectedEmail.is_archived ? "Unarchive" : "Archive"}
                </Button>
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
                <p>Date: {formatDate(selectedEmail.created_at)}</p>
                {selectedEmail.read_at && <p>Read: {formatDate(selectedEmail.read_at)}</p>}
                {selectedEmail.ip_address && <p>IP: {selectedEmail.ip_address}</p>}
                {selectedEmail.origin_url && <p>Origin: {selectedEmail.origin_url}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
