import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Package, MapPin, Clock, CheckCircle, AlertTriangle, Wrench, LogOut, Loader2, QrCode } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { inventoryApi, InventoryItem, InventoryStatus } from "@/services/api/inventory";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const statusConfig = {
  in_stock: { label: "In Stock", icon: CheckCircle, color: "bg-green-500/10 text-green-600 border-green-500/20" },
  out: { label: "Out", icon: LogOut, color: "bg-red-500/10 text-red-600 border-red-500/20" },
  maintenance: { label: "Maintenance", icon: Wrench, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  checked_out: { label: "Checked Out", icon: AlertTriangle, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
};

export default function Scan() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [newStatus, setNewStatus] = useState<InventoryStatus | "">("");
  const [location, setLocation] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Log the scan and get item details
        const response = await inventoryApi.getByQrCode(id, location || undefined);
        
        if (response.data?.item) {
          setItem(response.data.item);
          setNewStatus(response.data.item.status);
          setLocation(response.data.item.location || "");
          setIsOwner(response.data.is_owner || false);
        } else {
          setNotFound(true);
        }
      } catch (error: any) {
        console.error("Failed to fetch item:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!item || !newStatus) return;
    
    setUpdating(true);
    try {
      const response = await inventoryApi.publicUpdateStatus(item.qr_id!, {
        status: newStatus as InventoryStatus,
        location: location || undefined,
      });
      
      if (response.data) {
        setItem(response.data);
        toast({
          title: "Status Updated",
          description: `Item status changed to ${statusConfig[newStatus as InventoryStatus].label}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "You don't have permission to update this item",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading item details...</p>
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
                This QR code is not linked to any inventory item, or the item has been removed.
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
      <main className="flex-1 container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">{item.name}</CardTitle>
            <CardDescription className="text-base">{item.category}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="flex items-center justify-center">
              <Badge className={`text-sm px-4 py-2 ${statusConfig[item.status]?.color}`}>
                <StatusIcon className="h-4 w-4 mr-2" />
                {statusConfig[item.status]?.label || item.status}
              </Badge>
            </div>

            {/* Item Details */}
            <div className="grid gap-4 pt-4 border-t">
              {item.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{item.location}</span>
                </div>
              )}
              
              {item.last_scan_date && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Scanned:</span>
                  <span className="font-medium">
                    {new Date(item.last_scan_date).toLocaleString()}
                  </span>
                </div>
              )}
              
              {item.notes && (
                <div className="bg-muted/50 rounded-lg p-4 mt-2">
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                </div>
              )}
            </div>

            {/* Status Update Form - Only for authorized users */}
            {isOwner && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-center">Update Item</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as InventoryStatus)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          In Stock
                        </div>
                      </SelectItem>
                      <SelectItem value="out">
                        <div className="flex items-center gap-2">
                          <LogOut className="h-4 w-4 text-red-600" />
                          Out
                        </div>
                      </SelectItem>
                      <SelectItem value="maintenance">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-yellow-600" />
                          Maintenance
                        </div>
                      </SelectItem>
                      <SelectItem value="checked_out">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-blue-600" />
                          Checked Out
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter current location"
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleUpdateStatus}
                  disabled={updating || newStatus === item.status && location === (item.location || "")}
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Item"
                  )}
                </Button>
              </div>
            )}

            {/* Scan timestamp */}
            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              Scanned at {new Date().toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
