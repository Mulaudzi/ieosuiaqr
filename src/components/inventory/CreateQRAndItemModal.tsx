import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { inventoryApi, InventoryStatus } from "@/services/api/inventory";
import { qrCodeApi } from "@/services/api";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Package,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import ieosuiaLogo from "@/assets/ieosuia-logo.png";

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

interface CreateQRAndItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateQRAndItemModal({ open, onOpenChange, onSuccess }: CreateQRAndItemModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Equipment");
  const [status, setStatus] = useState<InventoryStatus>("in_stock");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdQRId, setCreatedQRId] = useState<string | null>(null);
  const [qrContent, setQrContent] = useState("");
  const { toast } = useToast();

  const reset = () => {
    setStep(1);
    setName("");
    setCategory("Equipment");
    setStatus("in_stock");
    setLocation("");
    setNotes("");
    setCreatedQRId(null);
    setQrContent("");
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Name required", description: "Please enter an item name." });
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Create QR Code
      const qrUrl = `https://qr.ieosuia.com/scan/${name.replace(/\s/g, "-").toLowerCase()}-${Date.now()}`;
      setQrContent(qrUrl);

      const qrResponse = await qrCodeApi.create({
        name: `${name} QR`,
        type: "url",
        content: { url: qrUrl },
      });

      const qrId = qrResponse.data.id;
      setCreatedQRId(qrId);
      setStep(2);

      // Step 2: Create Inventory Item linked to QR
      await inventoryApi.create({
        name,
        category,
        status,
        location: location || undefined,
        notes: notes || undefined,
        qr_id: qrId,
      });

      setStep(3);
      toast({
        title: "Success!",
        description: "QR code and inventory item created and linked.",
      });
      onSuccess();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create QR and item.",
      });
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Create QR + Inventory Item
          </DialogTitle>
          <DialogDescription>
            Create a QR code and inventory item together in one step.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <ArrowRight className={`w-4 h-4 ${step > s ? "text-primary" : "text-muted-foreground"}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Item Name *</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Projector, Laptop, Equipment"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
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
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Office A, Warehouse"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details..."
                rows={2}
              />
            </div>

            <Button
              variant="hero"
              className="w-full"
              onClick={handleCreate}
              disabled={isCreating || !name.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Create QR + Item
                </>
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="font-medium">Creating inventory item...</p>
            <p className="text-sm text-muted-foreground">Linking to QR code</p>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">All Done!</h3>
            <p className="text-muted-foreground mb-6">
              Your QR code and inventory item are ready to use.
            </p>

            {/* QR Preview */}
            <div className="inline-block p-4 rounded-xl bg-muted/50 border border-border mb-6">
              <QRCodeSVG
                value={qrContent || "https://ieosuia.com"}
                size={150}
                level="H"
                fgColor="hsl(174, 72%, 35%)"
                imageSettings={{
                  src: ieosuiaLogo,
                  x: undefined,
                  y: undefined,
                  height: 35,
                  width: 35,
                  excavate: true,
                }}
              />
              <p className="text-sm font-medium mt-3">{name}</p>
              <div className="flex items-center justify-center gap-2 mt-1 text-xs text-muted-foreground">
                <Package className="w-3 h-3" />
                <span>{category}</span>
              </div>
            </div>

            <Button variant="hero" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
