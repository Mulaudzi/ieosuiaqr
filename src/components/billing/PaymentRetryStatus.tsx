import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock, CreditCard, RefreshCw, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { billingApi } from "@/services/api/billing";

interface RetryInfo {
  status: string;
  retry_count: number;
  max_retries: number;
  next_retry_at: string | null;
  grace_period_ends_at: string | null;
  days_remaining: number | null;
  failure_reason: string | null;
  amount: number;
}

interface RetryStatusData {
  has_retry: boolean;
  subscription_status?: string;
  plan?: string;
  retry?: RetryInfo;
  message?: string;
}

export function PaymentRetryStatus() {
  const [status, setStatus] = useState<RetryStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRetryStatus = async () => {
    try {
      const response = await billingApi.getRetryStatus();
      setStatus(response as unknown as RetryStatusData);
    } catch (error) {
      console.error("Failed to fetch retry status:", error);
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRetryStatus();
  }, []);

  if (isLoading) {
    return null;
  }

  if (!status?.has_retry || !status.retry) {
    return null;
  }

  const { retry, plan, subscription_status } = status;
  const progressPercent = ((retry.max_retries - retry.retry_count) / retry.max_retries) * 100;
  
  const getUrgencyLevel = () => {
    if (retry.days_remaining !== null) {
      if (retry.days_remaining <= 2) return "critical";
      if (retry.days_remaining <= 4) return "warning";
    }
    return "info";
  };

  const urgency = getUrgencyLevel();
  const urgencyColors = {
    critical: "bg-destructive/10 border-destructive text-destructive",
    warning: "bg-yellow-500/10 border-yellow-500 text-yellow-600",
    info: "bg-blue-500/10 border-blue-500 text-blue-600",
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6"
      >
        <Card className={`border-2 ${urgencyColors[urgency]}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5" />
                Payment Failed - Action Required
              </CardTitle>
              <Badge variant={urgency === "critical" ? "destructive" : "secondary"}>
                {retry.days_remaining !== null 
                  ? `${retry.days_remaining} days left` 
                  : "Grace period active"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We were unable to process your payment for the <strong>{plan}</strong> plan.
              Please update your payment method to avoid subscription cancellation.
            </p>

            {/* Status Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground">Amount Due</span>
                <p className="font-semibold text-foreground">
                  R{retry.amount.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Retry Attempts</span>
                <p className="font-semibold text-foreground">
                  {retry.retry_count} of {retry.max_retries}
                </p>
              </div>
              {retry.next_retry_at && retry.status === "pending" && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">Next Retry</span>
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(retry.next_retry_at)}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-muted-foreground">Grace Period Ends</span>
                <p className="font-semibold text-foreground">
                  {formatDate(retry.grace_period_ends_at)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Retry Progress</span>
                <span>{retry.retry_count}/{retry.max_retries} attempts</span>
              </div>
              <Progress value={100 - progressPercent} className="h-2" />
            </div>

            {/* Failure Reason */}
            {retry.failure_reason && (
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">Reason: </span>
                  <span className="text-muted-foreground">{retry.failure_reason}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                className="flex-1"
                onClick={() => window.location.href = "/dashboard/subscription"}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method
              </Button>
              <Button 
                variant="outline" 
                onClick={fetchRetryStatus}
                className="sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            </div>

            {/* Warning Message */}
            {urgency === "critical" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Urgent:</strong> Your subscription will be canceled in {retry.days_remaining} day{retry.days_remaining !== 1 ? "s" : ""} if payment is not received.
                </span>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
