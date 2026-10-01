import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Package, MapPin, Clock, CheckCircle, AlertTriangle, Wrench, LogOut, Loader2, QrCode, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { inventoryApi, InventoryItem } from "@/services/api/inventory";
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
  const [notFound, setNotFound] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Log the scan and get item details
        const response = await inventoryApi.getByQrCode(id);
        
        if (response.data?.item) {
          setItem(response.data.item);
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
              
              {/* Management links are authenticated; the public scan remains read-only. */}
              {isOwner && <div className="pt-2 flex flex-wrap gap-3">
                <Link 
                  to={`/scan/${id}/history`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <History className="h-4 w-4" />
                  View scan & status history
                </Link>
                <Link to={`/dashboard/inventory/${item.id}`} className="text-sm text-primary hover:underline">Manage inventory</Link>
              </div>}
              {!user && <Button asChild variant="outline" className="w-full"><Link to={`/login?return_to=${encodeURIComponent(`/scan/${id}`)}`}>Sign in to manage this inventory</Link></Button>}
            </div>

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
