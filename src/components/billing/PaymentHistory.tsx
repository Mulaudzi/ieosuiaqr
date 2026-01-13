import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  CreditCard, 
  CheckCircle,
  XCircle,
  Clock,
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
import { billingApi, PaymentRecord } from "@/services/api/billing";

const statusConfig = {
  succeeded: {
    label: "Succeeded",
    icon: CheckCircle,
    className: "bg-success/20 text-success border-success/30",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-warning/20 text-warning border-warning/30",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
  refunded: {
    label: "Refunded",
    icon: RefreshCw,
    className: "bg-muted text-muted-foreground border-muted",
  },
};

export function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async (showRefreshToast = false) => {
    if (showRefreshToast) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const response = await billingApi.getPaymentHistory({ page: 1, per_page: 20 });
      if (response.success && response.data) {
        setPayments(response.data);
      }
      if (showRefreshToast) {
        toast({
          title: "Refreshed",
          description: "Payment history updated.",
        });
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSyncSubscription = async () => {
    setIsSyncing(true);
    try {
      const response = await billingApi.syncSubscription();
      if (response.success) {
        toast({
          title: "Subscription synced",
          description: `Current plan: ${response.data?.plan || 'Free'}`,
        });
        // Refresh payments after sync
        await fetchPayments();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "Could not sync subscription status. Please try again.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border">
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment History
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

  if (payments.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment History
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncSubscription}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync
          </Button>
        </div>
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No payments yet</p>
          <p className="text-sm text-muted-foreground">
            Your payment history will appear here after your first payment
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment History
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncSubscription}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchPayments(true)}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Payment ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const status = statusConfig[payment.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium font-mono text-sm">{payment.payment_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.created_at), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatPrice(payment.amount_zar)}
                  </TableCell>
                  <TableCell className="capitalize">
                    {payment.payment_method || "Card"}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={`gap-1 ${status.className}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        All amounts are in South African Rand (ZAR). Contact support for payment disputes.
      </p>
    </motion.div>
  );
}
