import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Package, MapPin, Clock, CheckCircle, AlertTriangle, Wrench, LogOut, 
  Loader2, QrCode, History, ArrowLeft, Smartphone, Monitor, Tablet, Globe 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { inventoryApi, InventoryItem } from "@/services/api/inventory";
import { get } from "@/services/api/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { format } from "date-fns";

const statusConfig = {
  in_stock: { label: "In Stock", icon: CheckCircle, color: "bg-green-500/10 text-green-600 border-green-500/20" },
  out: { label: "Out", icon: LogOut, color: "bg-red-500/10 text-red-600 border-red-500/20" },
  maintenance: { label: "Maintenance", icon: Wrench, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  checked_out: { label: "Checked Out", icon: AlertTriangle, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
};

interface StatusChange {
  id: string;
  item_id: string;
  old_status: string | null;
  new_status: string;
  old_location: string | null;
  new_location: string | null;
  changed_by: string | null;
  changed_at: string;
}

interface ScanLog {
  id: string;
  qr_id: string;
  city: string | null;
  country: string | null;
  device_type: string;
  browser: string;
  os: string;
  scanned_at: string;
}

const deviceIcons: Record<string, React.ElementType> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

export default function ItemHistory() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusChange[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Get item details
        const itemResponse = await inventoryApi.getByQrCode(id);
        
        if (itemResponse.data?.item) {
          setItem(itemResponse.data.item);
          
          // Fetch status history
          try {
            const historyResponse = await get<{ data: StatusChange[] }>(`/inventory/qr/${id}/history`);
            setStatusHistory(historyResponse.data || []);
          } catch (e) {
            console.log("No status history available");
          }
          
          // Fetch scan history
          try {
            const scanResponse = await get<{ data: ScanLog[] }>(`/qr/${id}/scans`);
            setScanHistory(scanResponse.data || []);
          } catch (e) {
            console.log("No scan history available");
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Failed to fetch item:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <QrCode className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>Item Not Found</CardTitle>
              <CardDescription>
                This QR code is not linked to any inventory item.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const StatusIcon = statusConfig[item.status]?.icon || Package;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container max-w-4xl mx-auto py-8 px-4">
        {/* Back link */}
        <Link to={`/scan/${id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Item
        </Link>

        {/* Item Summary */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{item.name}</CardTitle>
                  <CardDescription>{item.category}</CardDescription>
                </div>
              </div>
              <Badge className={`text-sm px-3 py-1 ${statusConfig[item.status]?.color}`}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {statusConfig[item.status]?.label || item.status}
              </Badge>
            </div>
          </CardHeader>
          {item.location && (
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Current location: <span className="font-medium text-foreground">{item.location}</span>
              </div>
            </CardContent>
          )}
        </Card>

        {/* History Tabs */}
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Status Changes ({statusHistory.length})
            </TabsTrigger>
            <TabsTrigger value="scans" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Scans ({scanHistory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="mt-6">
            {statusHistory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No status changes recorded yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Changes will appear here when the item status is updated.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {statusHistory.map((change, index) => {
                  const NewStatusIcon = statusConfig[change.new_status as keyof typeof statusConfig]?.icon || Package;
                  const OldStatusIcon = change.old_status 
                    ? statusConfig[change.old_status as keyof typeof statusConfig]?.icon || Package 
                    : null;
                  
                  return (
                    <Card key={change.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <NewStatusIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {change.old_status && OldStatusIcon && (
                                  <>
                                    <Badge variant="outline" className="text-xs">
                                      {statusConfig[change.old_status as keyof typeof statusConfig]?.label || change.old_status}
                                    </Badge>
                                    <span className="text-muted-foreground">→</span>
                                  </>
                                )}
                                <Badge className={`text-xs ${statusConfig[change.new_status as keyof typeof statusConfig]?.color}`}>
                                  {statusConfig[change.new_status as keyof typeof statusConfig]?.label || change.new_status}
                                </Badge>
                              </div>
                              {(change.old_location !== change.new_location) && change.new_location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  Moved to: {change.new_location}
                                </p>
                              )}
                              {change.changed_by && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  By: {change.changed_by}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(change.changed_at), "MMM d, yyyy")}
                            </div>
                            <div className="mt-0.5">
                              {format(new Date(change.changed_at), "h:mm a")}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scans" className="mt-6">
            {scanHistory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No scans recorded yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Scans will appear here when someone scans the QR code.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {scanHistory.map((scan, index) => {
                  const DeviceIcon = deviceIcons[scan.device_type?.toLowerCase()] || Smartphone;
                  return (
                    <Card key={scan.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <DeviceIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  Scan #{scanHistory.length - index}
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
