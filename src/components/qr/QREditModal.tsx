import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StoredQRCode } from "@/hooks/useQRStorage";

interface QREditModalProps {
  qrCode: StoredQRCode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<StoredQRCode>) => Promise<void>;
}

export function QREditModal({ qrCode, open, onOpenChange, onSave }: QREditModalProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Initialize form when qrCode changes
  useEffect(() => {
    if (qrCode) {
      setName(qrCode.name);
      setContent(qrCode.content);
      setFgColor(qrCode.fgColor);
      setBgColor(qrCode.bgColor);
    }
  }, [qrCode]);

  const handleSave = async () => {
    if (!qrCode) return;

    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter a name for your QR code.",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "Content required",
        description: "Please enter content for your QR code.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(qrCode.id, {
        name: name.trim(),
        content: content.trim(),
        fgColor,
        bgColor,
      });
      toast({
        title: "QR Code updated",
        description: "Your changes have been saved.",
      });
      onOpenChange(false);
    } catch {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not save changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!qrCode) return null;

  // Determine if content is editable based on type
  const isSimpleContent = ["url", "text", "email", "phone"].includes(qrCode.type);
  const contentLabel = {
    url: "URL",
    text: "Text",
    email: "Email Address",
    phone: "Phone Number",
    wifi: "WiFi Network",
    vcard: "Contact",
    event: "Event",
    location: "Location",
  }[qrCode.type] || "Content";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit QR Code</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: bgColor }}
            >
              <QRCodeSVG
                value={content || "preview"}
                size={120}
                level="H"
                fgColor={fgColor}
                bgColor={bgColor}
              />
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My QR Code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{contentLabel}</Label>
              {isSimpleContent ? (
                <Input
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    qrCode.type === "url"
                      ? "https://example.com"
                      : qrCode.type === "email"
                      ? "email@example.com"
                      : qrCode.type === "phone"
                      ? "+27 12 345 6789"
                      : "Enter content..."
                  }
                />
              ) : (
                <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                  <p>Complex content types can only be edited by creating a new QR code.</p>
                  <p className="mt-1 font-medium">Current: {content}</p>
                </div>
              )}
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fgColor">Foreground Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="fgColor"
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bgColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="bgColor"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    placeholder="#FFFFFF"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button variant="hero" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
