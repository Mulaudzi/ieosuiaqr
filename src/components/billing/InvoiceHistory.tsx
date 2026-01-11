import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  FileText, 
  Download, 
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { billingApi } from "@/services/api/billing";

interface Invoice {
  id: string;
  invoice_number: string;
  amount_zar: number;
  status: "paid" | "pending" | "failed" | "refunded";
  description: string;
  invoice_date: string;
  pdf_url?: string | null;
}

const statusConfig = {
  paid: {
    label: "Paid",
    icon: CheckCircle,
    variant: "default" as const,
    className: "bg-success/20 text-success border-success/30",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    variant: "secondary" as const,
    className: "bg-warning/20 text-warning border-warning/30",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    variant: "destructive" as const,
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
  refunded: {
    label: "Refunded",
    icon: RefreshCw,
    variant: "outline" as const,
    className: "bg-muted text-muted-foreground border-muted",
  },
};

export function InvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await billingApi.getInvoices({ page: 1, per_page: 10 });
      if (response.success && response.data) {
        // Map API response to component Invoice type
        setInvoices(response.data.map(inv => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          amount_zar: inv.amount_zar,
          status: inv.status,
          description: inv.description,
          invoice_date: inv.invoice_date,
          pdf_url: inv.pdf_url,
        })));
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      // Show empty state on error
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDownloadReceipt = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      const response = await billingApi.downloadReceipt(invoice.id);
      if (response.success && response.data?.download_url) {
        // Open PDF in new tab for download
        window.open(response.data.download_url, "_blank");
        toast({
          title: "Receipt Ready",
          description: `Receipt for ${invoice.invoice_number} opened in new tab.`,
        });
      } else {
        throw new Error("No download URL");
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not download receipt. Please try again.",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    setViewingId(invoice.id);
    try {
      const response = await billingApi.getInvoice(invoice.id);
      if (response.success && response.data) {
        // If there's a PDF URL, open it; otherwise show details toast
        if (response.data.pdf_url) {
          window.open(response.data.pdf_url, "_blank");
        } else {
          toast({
            title: "Invoice Details",
            description: `${invoice.invoice_number}: ${invoice.description} - ${formatPrice(invoice.amount_zar)}`,
          });
        }
      }
    } catch {
      toast({
        title: "Invoice Details",
        description: `${invoice.invoice_number}: ${invoice.description}`,
      });
    } finally {
      setViewingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border">
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Invoice History
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border">
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Invoice History
        </h3>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No invoices yet</p>
          <p className="text-sm text-muted-foreground">
            Your invoices will appear here after you upgrade
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-card border border-border"
    >
      <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Invoice History
      </h3>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const status = statusConfig[invoice.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.invoice_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatPrice(invoice.amount_zar)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={status.variant}
                      className={`gap-1 ${status.className}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                        disabled={viewingId === invoice.id}
                      >
                        {viewingId === invoice.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadReceipt(invoice)}
                        disabled={downloadingId === invoice.id}
                      >
                        {downloadingId === invoice.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        All amounts are in South African Rand (ZAR). Receipts are available for download within 12 months.
      </p>
    </motion.div>
  );
}
