import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryItem } from "@/services/api/inventory";
import { get } from "@/services/api/client";
import {
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  Globe,
  History,
  QrCode,
} from "lucide-react";
import { format } from "date-fns";

interface ScanLog {
  id: string;
  qr_id: string;
  ip_hash: string;
  location: string | null;
  city: string | null;
  country: string | null;
  device_type: string;
  browser: string;
  os: string;
  scanned_at: string;
}

interface ScanHistoryModalProps {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const deviceIcons: Record<string, React.ElementType> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

export function ScanHistoryModal({ item, open, onOpenChange }: ScanHistoryModalProps) {
  const [scans, setScans] = useState<ScanLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && item?.qr_id) {
      fetchScanHistory();
    }
  }, [open, item?.qr_id]);

  const fetchScanHistory = async () => {
    if (!item?.qr_id) return;
    
    setIsLoading(true);
    try {
      const response = await get<{ data: ScanLog[] }>(`/qr/${item.qr_id}/scans`);
      setScans(response.data || []);
    } catch (error) {
      console.error("Failed to fetch scan history:", error);
      setScans([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    const Icon = deviceIcons[deviceType?.toLowerCase()] || Smartphone;
    return Icon;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Scan History
          </DialogTitle>
          <DialogDescription>
            {item?.name} - {item?.qr_id ? "Linked QR scans" : "No QR linked"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!item?.qr_id ? (
            <div className="text-center py-12">
              <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No QR code linked to this item.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Link a QR code to track scans.
              </p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : scans.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No scans recorded yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Scans will appear here when someone scans the QR code.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scans.map((scan, index) => {
                const DeviceIcon = getDeviceIcon(scan.device_type);
                return (
                  <div
                    key={scan.id}
                    className="p-4 rounded-lg bg-card border border-border hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <DeviceIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              Scan #{scans.length - index}
                            </span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {scan.device_type || "Unknown"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {(scan.city || scan.country) && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {[scan.city, scan.country].filter(Boolean).join(", ")}
                              </span>
                            )}
                            {scan.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {scan.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              {scan.browser} / {scan.os}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(scan.scanned_at), "MMM d, yyyy")}
                        </div>
                        <div className="mt-0.5">
                          {format(new Date(scan.scanned_at), "h:mm a")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {scans.length > 0 && (
          <div className="pt-4 border-t border-border text-center text-sm text-muted-foreground">
            Total: {scans.length} scan{scans.length !== 1 ? "s" : ""}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
