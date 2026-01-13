import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Package, AlertTriangle, Clock, Activity, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { inventoryApi, InventoryAlert } from "@/services/api/inventory";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const alertIcons: Record<string, React.ReactNode> = {
  low_activity: <Activity className="w-4 h-4 text-warning" />,
  maintenance_due: <Clock className="w-4 h-4 text-accent" />,
  status_change: <Package className="w-4 h-4 text-primary" />,
  custom: <AlertTriangle className="w-4 h-4 text-destructive" />,
};

const priorityColors: Record<string, string> = {
  low: "border-l-muted-foreground",
  medium: "border-l-warning",
  high: "border-l-destructive",
};

export function NotificationBell() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      const response = await inventoryApi.getAlerts();
      if (response.success && response.data) {
        setAlerts(response.data.alerts);
        setUnreadCount(response.data.unread_count);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll for new alerts every minute
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await inventoryApi.markAlertsRead();
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark alerts as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (alertId: string) => {
    try {
      await inventoryApi.markAlertsRead([alertId]);
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 p-0 bg-popover border border-border shadow-xl"
        sideOffset={8}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isLoading}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                We'll notify you about important updates
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {alerts.slice(0, 10).map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "p-3 hover:bg-muted/50 transition-colors cursor-pointer border-l-2",
                    priorityColors[alert.priority] || "border-l-transparent",
                    !alert.is_read && "bg-primary/5"
                  )}
                  onClick={() => !alert.is_read && handleMarkRead(alert.id)}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      {alertIcons[alert.alert_type] || <Bell className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          !alert.is_read && "font-medium"
                        )}>
                          {alert.title}
                        </p>
                        {!alert.is_read && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      {alert.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {alert.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>

        {alerts.length > 0 && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link to="/dashboard/inventory/analytics">
                View all notifications
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
