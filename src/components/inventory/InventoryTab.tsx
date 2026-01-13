import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useQRStorage, StoredQRCode } from "@/hooks/useQRStorage";
import { inventoryApi, InventoryItem, InventoryStatus } from "@/services/api/inventory";
import { UpsellModal } from "@/components/qr/UpsellModal";
import {
  Package,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  QrCode,
  Loader2,
  Box,
  AlertCircle,
  CheckCircle,
  Clock,
  Crown,
  Link as LinkIcon,
  FileSpreadsheet,
  History,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { BulkInventoryImport } from "./BulkInventoryImport";
import { ScanHistoryModal } from "./ScanHistoryModal";
import { CreateQRAndItemModal } from "./CreateQRAndItemModal";

const statusConfig: Record<InventoryStatus, { label: string; color: string; icon: React.ElementType }> = {
  in_stock: { label: "In Stock", color: "bg-success/10 text-success", icon: CheckCircle },
  out: { label: "Checked Out", color: "bg-warning/10 text-warning", icon: Clock },
  maintenance: { label: "Maintenance", color: "bg-destructive/10 text-destructive", icon: AlertCircle },
  checked_out: { label: "Checked Out", color: "bg-warning/10 text-warning", icon: Clock },
};

const categoryOptions = [
  "Electronics",
  "Furniture",
  "Equipment",
  "Books",
  "Supplies",
  "Tools",
  "Vehicles",
  "Other",
];

export function InventoryTab() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showScanHistory, setShowScanHistory] = useState(false);
  const [showQRItemModal, setShowQRItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  
  const { toast } = useToast();
  const { plan, isPro, isEnterprise } = useUserPlan();

  // Plan-based limits
  const getMaxItems = () => {
    if (isEnterprise) return Infinity;
    if (isPro) return 100;
    return 3;
  };

  const canEdit = isPro || isEnterprise;
  const maxItems = getMaxItems();

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await inventoryApi.list({
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
        status: statusFilter as InventoryStatus || undefined,
      });
      if (response.data) {
        setItems(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreate = async (data: {
    name: string;
    category: string;
    notes?: string;
    status: InventoryStatus;
    location?: string;
    qr_id?: string;
  }) => {
    if (items.length >= maxItems) {
      setShowUpsell(true);
      return;
    }

    try {
      const response = await inventoryApi.create(data);
      if (response.success) {
        toast({ title: "Item created!", description: "Inventory item added successfully." });
        setShowCreateDialog(false);
        fetchItems();
      }
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 403) {
        setShowUpsell(true);
      } else {
        toast({ variant: "destructive", title: "Error", description: err.message || "Failed to create item." });
      }
    }
  };

  const handleUpdate = async (id: string, data: Partial<InventoryItem>) => {
    if (!canEdit) {
      setShowUpsell(true);
      return;
    }

    try {
      const response = await inventoryApi.update(id, data);
      if (response.success) {
        toast({ title: "Item updated!", description: "Changes saved successfully." });
        setShowEditDialog(false);
        setSelectedItem(null);
        fetchItems();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to update item." });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await inventoryApi.delete(id);
      if (response.success) {
        toast({ title: "Item deleted", description: "Inventory item removed." });
        fetchItems();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to delete item." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Inventory Tracking
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track products, assets, and equipment with smart QR codes.
            <span className="ml-1 text-xs">
              ({items.length}/{maxItems === Infinity ? "∞" : maxItems} items)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Create QR + Item Button */}
          <Button 
            variant="outline"
            onClick={() => {
              if (items.length >= maxItems) {
                setShowUpsell(true);
              } else {
                setShowQRItemModal(true);
              }
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            QR + Item
          </Button>
          
          {/* Bulk Import (Enterprise) */}
          {isEnterprise && (
            <Button variant="outline" onClick={() => setShowBulkImport(true)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
          )}
          
          {/* Add Item */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="hero" 
                onClick={() => {
                  if (items.length >= maxItems) {
                    setShowUpsell(true);
                  } else {
                    setShowCreateDialog(true);
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>
                  Create a new item to track. You can link it to a QR code later.
                </DialogDescription>
              </DialogHeader>
              <InventoryForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Plan Upgrade Banner for Free Users */}
      {!canEdit && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-sm">Upgrade to edit items</p>
              <p className="text-xs text-muted-foreground">
                Pro unlocks editable tracking for up to 100 items. Enterprise offers unlimited with team sharing.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/settings?tab=billing">Upgrade</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categoryOptions.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="out">Checked Out</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Box className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No inventory items yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start tracking your products, equipment, or assets.
          </p>
          <Button variant="hero" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Item
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const status = statusConfig[item.status] || statusConfig.in_stock;
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* QR Preview */}
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {item.qr_id ? (
                      <QrCode className="w-8 h-8 text-primary" />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{item.name}</h4>
                      <Badge variant="outline" className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.category}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </span>
                      )}
                      {item.last_scan_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Last scan: {new Date(item.last_scan_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedItem(item);
                          setShowScanHistory(true);
                        }}
                      >
                        <History className="w-4 h-4 mr-2" />
                        Scan History
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (!canEdit) {
                            setShowUpsell(true);
                          } else {
                            setSelectedItem(item);
                            setShowEditDialog(true);
                          }
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Update the item details.</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <InventoryForm
              initialData={selectedItem}
              onSubmit={(data) => handleUpdate(selectedItem.id, data)}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Upsell Modal */}
      <UpsellModal
        open={showUpsell}
        onOpenChange={setShowUpsell}
        feature="More inventory items"
      />
      
      {/* Bulk Import Modal (Enterprise) */}
      <BulkInventoryImport
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        onSuccess={fetchItems}
      />
      
      {/* Scan History Modal */}
      <ScanHistoryModal
        item={selectedItem}
        open={showScanHistory}
        onOpenChange={setShowScanHistory}
      />
      
      {/* Create QR + Item Modal */}
      <CreateQRAndItemModal
        open={showQRItemModal}
        onOpenChange={setShowQRItemModal}
        onSuccess={fetchItems}
      />
    </div>
  );
}

function InventoryForm({
  initialData,
  onSubmit,
  isEdit = false,
}: {
  initialData?: Partial<InventoryItem>;
  onSubmit: (data: { name: string; category: string; notes?: string; status: InventoryStatus; location?: string; qr_id?: string }) => void;
  isEdit?: boolean;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || "Equipment");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [status, setStatus] = useState<InventoryStatus>(initialData?.status || "in_stock");
  const [location, setLocation] = useState(initialData?.location || "");
  const [linkToQR, setLinkToQR] = useState(false);
  const [selectedQRId, setSelectedQRId] = useState<string>(initialData?.qr_id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { qrCodes, isLoading: loadingQRCodes } = useQRStorage();
  
  // Filter QR codes that aren't already linked to inventory
  const availableQRCodes = qrCodes;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({ 
      name, 
      category, 
      notes: notes || undefined, 
      status, 
      location: location || undefined,
      qr_id: linkToQR && selectedQRId ? selectedQRId : undefined,
    });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="item-name">Item Name *</Label>
        <Input
          id="item-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Projector, Laptop, Book"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as InventoryStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="out">Checked Out</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Office A, Warehouse, Room 101"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional details..."
          rows={3}
        />
      </div>

      {/* QR Code Linking Section */}
      {!isEdit && (
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="link-qr" 
              checked={linkToQR} 
              onCheckedChange={(checked) => setLinkToQR(checked === true)}
            />
            <Label htmlFor="link-qr" className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary" />
              Link to existing QR Code
            </Label>
          </div>
          
          {linkToQR && (
            <div className="space-y-2 pl-6">
              {loadingQRCodes ? (
                <Skeleton className="h-10 w-full" />
              ) : availableQRCodes.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted">
                  No QR codes available.{" "}
                  <Link to="/dashboard/create" className="text-primary hover:underline">
                    Create one first
                  </Link>
                </div>
              ) : (
                <Select value={selectedQRId} onValueChange={setSelectedQRId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a QR code" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableQRCodes.map((qr) => (
                      <SelectItem key={qr.id} value={qr.id}>
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-primary" />
                          <span>{qr.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">{qr.type}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {selectedQRId && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="bg-background p-2 rounded-lg">
                    <QRCodeSVG 
                      value={availableQRCodes.find(q => q.id === selectedQRId)?.content || "https://qr.ieosuia.com"} 
                      size={60}
                      level="M"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {availableQRCodes.find(q => q.id === selectedQRId)?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {availableQRCodes.find(q => q.id === selectedQRId)?.content}
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                💡 Scanning this QR will update the item's last scan date and location.
              </p>
            </div>
          )}
        </div>
      )}

      <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting || !name}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isEdit ? "Saving..." : "Creating..."}
          </>
        ) : (
          isEdit ? "Save Changes" : "Create Item"
        )}
      </Button>
    </form>
  );
}
