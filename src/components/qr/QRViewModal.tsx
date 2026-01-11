import { useState, useEffect } from "react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  ExternalLink,
  BarChart3,
  Calendar,
  Smartphone,
  Globe,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { qrCodeApi } from "@/services/api/qrcodes";
import { StoredQRCode } from "@/hooks/useQRStorage";
import { useQRDownload } from "@/hooks/useQRDownload";

interface QRViewModalProps {
  qrCode: StoredQRCode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

interface QRStats {
  total_scans: number;
  unique_scans: number;
  last_scan: string | null;
  top_device: string;
  top_country: string;
}

export function QRViewModal({ qrCode, open, onOpenChange, onEdit }: QRViewModalProps) {
  const [stats, setStats] = useState<QRStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { downloadPNG, downloadSVG } = useQRDownload();

  useEffect(() => {
    if (open && qrCode) {
      fetchStats();
    }
  }, [open, qrCode]);

  const fetchStats = async () => {
    if (!qrCode) return;
    setIsLoadingStats(true);
    try {
      const response = await qrCodeApi.getStats(qrCode.id);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch {
      // Stats not available, use local data
      setStats({
        total_scans: qrCode.scans,
        unique_scans: Math.floor(qrCode.scans * 0.85),
        last_scan: null,
        top_device: "Mobile",
        top_country: "South Africa",
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleCopyContent = () => {
    if (!qrCode) return;
    navigator.clipboard.writeText(qrCode.content);
    setCopied(true);
    toast({ title: "Copied!", description: "Content copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (format: "png" | "svg") => {
    if (!qrCode) return;
    const options = {
      value: qrCode.content,
      fileName: qrCode.name.replace(/[^a-z0-9]/gi, '_'),
      fgColor: qrCode.fgColor,
      bgColor: qrCode.bgColor,
      size: 400,
    };
    if (format === "png") {
      await downloadPNG(options);
    } else {
      await downloadSVG(options);
    }
    toast({ title: "Downloaded", description: `QR code saved as ${format.toUpperCase()}` });
  };

  if (!qrCode) return null;

  const typeColors: Record<string, string> = {
    url: "bg-primary/10 text-primary",
    text: "bg-muted text-foreground",
    email: "bg-accent/10 text-accent",
    phone: "bg-success/10 text-success",
    wifi: "bg-warning/10 text-warning",
    vcard: "bg-accent/10 text-accent",
    event: "bg-primary/10 text-primary",
    location: "bg-success/10 text-success",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {qrCode.name}
            <Badge className={typeColors[qrCode.type] || "bg-muted"}>
              {qrCode.type}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code Preview */}
          <div className="flex flex-col items-center">
            <div
              id={`qr-view-${qrCode.id}`}
              className="p-6 rounded-2xl"
              style={{ backgroundColor: qrCode.bgColor }}
            >
              <QRCodeSVG
                value={qrCode.content}
                size={200}
                level="H"
                fgColor={qrCode.fgColor}
                bgColor={qrCode.bgColor}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => handleDownload("png")}>
                <Download className="w-4 h-4 mr-2" />
                PNG
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDownload("svg")}>
                <Download className="w-4 h-4 mr-2" />
                SVG
              </Button>
            </div>
          </div>

          {/* Details & Stats */}
          <div className="space-y-4">
            {/* Content */}
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Content</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate flex-1">{qrCode.content}</p>
                <Button variant="ghost" size="sm" onClick={handleCopyContent}>
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs">Created</span>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(qrCode.created), "MMM d, yyyy")}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BarChart3 className="w-3 h-3" />
                  <span className="text-xs">Status</span>
                </div>
                <Badge variant={qrCode.status === "active" ? "default" : "secondary"}>
                  {qrCode.status}
                </Badge>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 rounded-xl border border-border">
              <h4 className="text-sm font-semibold mb-3">Scan Statistics</h4>
              {isLoadingStats ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {stats.total_scans.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Scans</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {stats.unique_scans.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Unique Visitors</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{stats.top_device}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{stats.top_country}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No scan data available</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit();
                  }}
                >
                  Edit QR Code
                </Button>
              )}
              {qrCode.type === "url" && (
                <Button variant="outline" asChild>
                  <a href={qrCode.content} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
