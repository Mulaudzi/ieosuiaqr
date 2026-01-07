import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  FileText, 
  Download, 
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
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
import { useToast } from "@/hooks/use-toast";

// Mock invoice data - will be replaced with API calls
const mockInvoices = [
  {
    id: "inv_001",
    invoice_number: "INV-2025-001",
    amount_zar: 179,
    status: "paid" as const,
    description: "Pro Plan - Monthly",
    invoice_date: "2025-01-01T00:00:00Z",
    pdf_url: null,
  },
  {
    id: "inv_002",
    invoice_number: "INV-2024-012",
    amount_zar: 179,
    status: "paid" as const,
    description: "Pro Plan - Monthly",
    invoice_date: "2024-12-01T00:00:00Z",
    pdf_url: null,
  },
  {
    id: "inv_003",
    invoice_number: "INV-2024-011",
    amount_zar: 179,
    status: "paid" as const,
    description: "Pro Plan - Monthly",
    invoice_date: "2024-11-01T00:00:00Z",
    pdf_url: null,
  },
];

interface Invoice {
  id: string;
  invoice_number: string;
  amount_zar: number;
  status: "paid" | "pending" | "failed" | "refunded";
  description: string;
  invoice_date: string;
  pdf_url: string | null;
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
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDownloadReceipt = async (invoice: Invoice) => {
    setIsLoading(true);
    
    // Mock API call - will be replaced with:
    // const { data } = await billingApi.downloadReceipt(invoice.id);
    // window.open(data.pdf_url, '_blank');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast({
      title: "Receipt Downloaded",
      description: `Receipt for ${invoice.invoice_number} is ready.`,
    });
    
    setIsLoading(false);
    
    // In production, open PDF in new tab
    // window.open(invoice.pdf_url, '_blank');
  };

  const handleViewInvoice = (invoice: Invoice) => {
    toast({
      title: "Invoice Details",
      description: `Viewing ${invoice.invoice_number}: ${invoice.description}`,
    });
  };

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
              const status = statusConfig[invoice.status];
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
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadReceipt(invoice)}
                        disabled={isLoading}
                      >
                        <Download className="w-4 h-4" />
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
