import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Download, Package } from "lucide-react";
import { InventoryItem } from "@/services/api/inventory";
import { useState } from "react";
import ieosuiaLogo from "@/assets/ieosuia-logo.png";

interface QRLabelPrinterProps {
  items: InventoryItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LabelSize = "small" | "medium" | "large";

const labelSizes: Record<LabelSize, { width: number; height: number; qrSize: number; fontSize: string }> = {
  small: { width: 50, height: 30, qrSize: 20, fontSize: "6px" },
  medium: { width: 75, height: 50, qrSize: 35, fontSize: "8px" },
  large: { width: 100, height: 75, qrSize: 55, fontSize: "10px" },
};

export function QRLabelPrinter({ items, open, onOpenChange }: QRLabelPrinterProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [labelSize, setLabelSize] = useState<LabelSize>("medium");
  const [showCategory, setShowCategory] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [columns, setColumns] = useState(3);

  const appUrl = import.meta.env.VITE_APP_URL || "https://qr.ieosuia.com";

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const size = labelSizes[labelSize];

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Labels - IEOSUIA</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; }
          .label-grid {
            display: grid;
            grid-template-columns: repeat(${columns}, 1fr);
            gap: 10px;
            padding: 10px;
          }
          .label {
            width: ${size.width}mm;
            height: ${size.height}mm;
            border: 1px dashed #ccc;
            padding: 3mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            page-break-inside: avoid;
          }
          .label-qr {
            margin-bottom: 2mm;
          }
          .label-name {
            font-size: ${size.fontSize};
            font-weight: bold;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
          }
          .label-meta {
            font-size: calc(${size.fontSize} - 1px);
            color: #666;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
          }
          @media print {
            .label { border: 1px dashed #ddd; }
          }
        </style>
      </head>
      <body>
        <div class="label-grid">
          ${items.map(item => `
            <div class="label">
              <div class="label-qr">
                ${item.qr_id ? `<img src="${generateQRDataUrl(item.qr_id)}" width="${size.qrSize}mm" height="${size.qrSize}mm" />` : '<span style="font-size: 8px; color: #999;">No QR</span>'}
              </div>
              <div class="label-name">${item.name}</div>
              ${showCategory ? `<div class="label-meta">${item.category}</div>` : ''}
              ${showLocation && item.location ? `<div class="label-meta">${item.location}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const generateQRDataUrl = (qrId: string) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Create a temporary element to render QR code
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
    
    // Return a placeholder - the actual QR will be rendered via QRCodeSVG
    const url = `${appUrl}/scan/${qrId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
  };

  const size = labelSizes[labelSize];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            Print QR Labels
          </DialogTitle>
          <DialogDescription>
            Generate printable labels for {items.length} item{items.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b">
          <div className="space-y-2">
            <Label>Label Size</Label>
            <Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (50x30mm)</SelectItem>
                <SelectItem value="medium">Medium (75x50mm)</SelectItem>
                <SelectItem value="large">Large (100x75mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Columns</Label>
            <Select value={String(columns)} onValueChange={(v) => setColumns(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 columns</SelectItem>
                <SelectItem value="3">3 columns</SelectItem>
                <SelectItem value="4">4 columns</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Include</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="showCategory" 
                  checked={showCategory} 
                  onCheckedChange={(c) => setShowCategory(!!c)} 
                />
                <label htmlFor="showCategory" className="text-sm">Category</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="showLocation" 
                  checked={showLocation} 
                  onCheckedChange={(c) => setShowLocation(!!c)} 
                />
                <label htmlFor="showLocation" className="text-sm">Location</label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>&nbsp;</Label>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="showLogo" 
                checked={showLogo} 
                onCheckedChange={(c) => setShowLogo(!!c)} 
              />
              <label htmlFor="showLogo" className="text-sm">Logo in QR</label>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto py-4">
          <p className="text-sm text-muted-foreground mb-4">Preview:</p>
          <div 
            ref={printRef}
            className="grid gap-4 p-4 bg-white rounded-lg border"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-dashed border-gray-300 rounded p-3 flex flex-col items-center justify-center"
                style={{ 
                  minWidth: `${size.width}mm`, 
                  minHeight: `${size.height}mm`,
                  maxWidth: "150px"
                }}
              >
                {item.qr_id ? (
                  <QRCodeSVG
                    value={`${appUrl}/scan/${item.qr_id}`}
                    size={size.qrSize * 2.5}
                    level="M"
                    imageSettings={showLogo ? {
                      src: ieosuiaLogo,
                      height: size.qrSize * 0.5,
                      width: size.qrSize * 0.5,
                      excavate: true,
                    } : undefined}
                    className="mb-2"
                  />
                ) : (
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center mb-2">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <p 
                  className="font-semibold text-center truncate w-full"
                  style={{ fontSize: size.fontSize }}
                >
                  {item.name}
                </p>
                {showCategory && (
                  <p 
                    className="text-muted-foreground text-center truncate w-full"
                    style={{ fontSize: `calc(${size.fontSize} - 1px)` }}
                  >
                    {item.category}
                  </p>
                )}
                {showLocation && item.location && (
                  <p 
                    className="text-muted-foreground text-center truncate w-full"
                    style={{ fontSize: `calc(${size.fontSize} - 1px)` }}
                  >
                    {item.location}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
