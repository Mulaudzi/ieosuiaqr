import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Mail,
  Search,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Users,
  TrendingUp,
} from "lucide-react";

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
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  bounced: number;
  contact_forms: number;
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

export default function AdminEmails() {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const adminToken = localStorage.getItem("admin_token");

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin");
      return;
    }
    verifyAndFetch();
  }, [page, statusFilter, typeFilter]);

  const verifyAndFetch = async () => {
    try {
      // Verify access first
      const verifyRes = await fetch(`/api/admin/verify?admin_token=${adminToken}`);
      if (!verifyRes.ok) {
        localStorage.removeItem("admin_token");
        navigate("/admin");
        return;
      }
      
      await fetchEmails();
    } catch {
      navigate("/admin");
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
      });

      const response = await fetch(`/api/admin/emails?${params}`, {
        headers: {
          Authorization: `Admin ${adminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }

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
        headers: {
          Authorization: `Admin ${adminToken}`,
        },
      });
    } catch {
      // Ignore errors
    }
    localStorage.removeItem("admin_token");
    navigate("/admin");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    });
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
              <p className="text-xs text-muted-foreground">Email Logs & Analytics</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Emails</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.sent}</p>
              <p className="text-sm text-muted-foreground">Sent</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.failed}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-warning" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.bounced}</p>
              <p className="text-sm text-muted-foreground">Bounced</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-accent" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.contact_forms}</p>
              <p className="text-sm text-muted-foreground">Contact Forms</p>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
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
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="contact">Contact Form</SelectItem>
              <SelectItem value="verification">Verification</SelectItem>
              <SelectItem value="password_reset">Password Reset</SelectItem>
              <SelectItem value="welcome">Welcome</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
            </SelectContent>
          </Select>

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
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : emails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No email logs found.
                  </TableCell>
                </TableRow>
              ) : (
                emails.map((email) => {
                  const status = statusConfig[email.status] || statusConfig.pending;
                  const type = typeConfig[email.email_type] || typeConfig.other;
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={email.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEmail(email)}>
                      <TableCell>
                        <Badge variant="secondary" className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={type.color}>
                          {type.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{email.recipient_email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{email.subject}</TableCell>
                      <TableCell>
                        {email.sender_name ? (
                          <div>
                            <div className="font-medium text-sm">{email.sender_name}</div>
                            <div className="text-xs text-muted-foreground">{email.sender_email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(email.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedEmail(email); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
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
            <DialogTitle>Email Details</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-6">
              {/* Status & Type */}
              <div className="flex gap-2">
                <Badge variant="secondary" className={statusConfig[selectedEmail.status]?.color}>
                  {statusConfig[selectedEmail.status]?.label || selectedEmail.status}
                </Badge>
                <Badge variant="secondary" className={typeConfig[selectedEmail.email_type]?.color}>
                  {typeConfig[selectedEmail.email_type]?.label || selectedEmail.email_type}
                </Badge>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Recipient</p>
                  <p className="font-medium">{selectedEmail.recipient_email}</p>
                </div>
                {selectedEmail.cc_email && (
                  <div>
                    <p className="text-muted-foreground mb-1">CC</p>
                    <p className="font-medium">{selectedEmail.cc_email}</p>
                  </div>
                )}
                {selectedEmail.reply_to_email && (
                  <div>
                    <p className="text-muted-foreground mb-1">Reply To</p>
                    <p className="font-medium">{selectedEmail.reply_to_email}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">{formatDate(selectedEmail.created_at)}</p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <p className="text-muted-foreground mb-1 text-sm">Subject</p>
                <p className="font-medium">{selectedEmail.subject}</p>
              </div>

              {/* Sender Info (for contact forms) */}
              {selectedEmail.sender_name && (
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm font-medium mb-3">Sender Information</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedEmail.sender_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedEmail.sender_email}</p>
                    </div>
                    {selectedEmail.sender_company && (
                      <div>
                        <p className="text-muted-foreground">Company</p>
                        <p className="font-medium">{selectedEmail.sender_company}</p>
                      </div>
                    )}
                    {selectedEmail.inquiry_purpose && (
                      <div>
                        <p className="text-muted-foreground">Purpose</p>
                        <p className="font-medium">{selectedEmail.inquiry_purpose}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message Preview */}
              {selectedEmail.body_preview && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">Message Preview</p>
                  <div className="p-4 rounded-xl bg-muted/50 text-sm whitespace-pre-wrap">
                    {selectedEmail.body_preview}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {selectedEmail.error_message && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive mb-1">Error Message</p>
                  <p className="text-sm text-destructive/80">{selectedEmail.error_message}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
                {selectedEmail.ip_address && <p>IP Address: {selectedEmail.ip_address}</p>}
                {selectedEmail.origin_url && <p>Origin: {selectedEmail.origin_url}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
