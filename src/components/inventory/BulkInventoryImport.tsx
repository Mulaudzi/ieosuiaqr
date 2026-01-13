import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { inventoryApi, InventoryStatus } from "@/services/api/inventory";
import { qrCodeApi } from "@/services/api";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ParsedRow {
  name: string;
  category: string;
  status: InventoryStatus;
  location: string;
  notes: string;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  name: string;
  success: boolean;
  error?: string;
  qrCreated?: boolean;
}

interface BulkInventoryImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const VALID_STATUSES: InventoryStatus[] = ["in_stock", "out", "maintenance", "checked_out"];

export function BulkInventoryImport({ open, onOpenChange, onSuccess }: BulkInventoryImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [autoGenerateQR, setAutoGenerateQR] = useState(true);
  const { toast } = useToast();

  const parseCSV = useCallback((text: string): ParsedRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));
    const nameIdx = headers.findIndex(h => h === "name" || h === "item" || h === "item name");
    const categoryIdx = headers.findIndex(h => h === "category" || h === "type");
    const statusIdx = headers.findIndex(h => h === "status");
    const locationIdx = headers.findIndex(h => h === "location" || h === "place");
    const notesIdx = headers.findIndex(h => h === "notes" || h === "description");

    if (nameIdx === -1) {
      return [];
    }

    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
      const name = values[nameIdx] || "";
      const category = categoryIdx >= 0 ? values[categoryIdx] : "Equipment";
      const statusRaw = statusIdx >= 0 ? values[statusIdx]?.toLowerCase().replace(/\s/g, "_") : "in_stock";
      const status = VALID_STATUSES.includes(statusRaw as InventoryStatus) 
        ? statusRaw as InventoryStatus 
        : "in_stock";
      const location = locationIdx >= 0 ? values[locationIdx] : "";
      const notes = notesIdx >= 0 ? values[notesIdx] : "";

      const valid = name.length >= 1;
      const error = !valid ? "Name is required" : undefined;

      return { name, category, status, location, notes, valid, error };
    }).filter(row => row.name);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a CSV file.",
      });
      return;
    }

    setFile(selectedFile);
    setResults([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setParsedData(parsed);

      if (parsed.length === 0) {
        toast({
          variant: "destructive",
          title: "Invalid CSV",
          description: "Could not parse the file. Ensure it has a 'name' column.",
        });
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    const validRows = parsedData.filter(r => r.valid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    const importResults: ImportResult[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        let qrId: string | undefined;

        // Auto-generate QR code if enabled
        if (autoGenerateQR) {
          try {
            const qrResponse = await qrCodeApi.create({
              name: `${row.name} QR`,
              type: "url",
              content: { url: `https://qr.ieosuia.com/scan/${row.name.replace(/\s/g, "-").toLowerCase()}` },
            });
            qrId = qrResponse.data.id;
          } catch {
            // QR creation failed, continue without linking
          }
        }

        await inventoryApi.create({
          name: row.name,
          category: row.category,
          status: row.status,
          location: row.location || undefined,
          notes: row.notes || undefined,
          qr_id: qrId,
        });

        importResults.push({ name: row.name, success: true, qrCreated: !!qrId });
      } catch (error: unknown) {
        const err = error as { message?: string };
        importResults.push({ name: row.name, success: false, error: err.message || "Failed to import" });
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setResults(importResults);
    setIsImporting(false);

    const successCount = importResults.filter(r => r.success).length;
    if (successCount > 0) {
      toast({
        title: "Import complete",
        description: `${successCount} of ${validRows.length} items imported successfully.`,
      });
      onSuccess();
    }
  };

  const downloadTemplate = () => {
    const template = `name,category,status,location,notes
"Projector","Equipment","in_stock","Room 101","Main conference projector"
"Laptop Dell","Electronics","out","IT Office","Assigned to John"
"Chair Office","Furniture","in_stock","Storage A",""`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setParsedData([]);
    setResults([]);
    setImportProgress(0);
  };

  const validCount = parsedData.filter(r => r.valid).length;
  const invalidCount = parsedData.filter(r => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Bulk Import Inventory
          </DialogTitle>
          <DialogDescription>
            Import multiple inventory items from a CSV file. Enterprise users can auto-generate QR codes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div>
              <p className="font-medium text-sm">Download Template</p>
              <p className="text-xs text-muted-foreground">
                Use our CSV template with the correct column format
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
          </div>

          {/* File Upload */}
          {!file ? (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <Label
                htmlFor="csv-upload"
                className="block cursor-pointer"
              >
                <span className="text-primary font-medium">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
                <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
              </Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <>
              {/* File Info */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {validCount} valid, {invalidCount} invalid rows
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Change File
                </Button>
              </div>

              {/* Auto QR Toggle */}
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Checkbox 
                  id="auto-qr" 
                  checked={autoGenerateQR} 
                  onCheckedChange={(c) => setAutoGenerateQR(c === true)} 
                />
                <Label htmlFor="auto-qr" className="cursor-pointer flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary" />
                  Auto-generate QR codes for each item (Enterprise)
                </Label>
              </div>

              {/* Preview Table */}
              {parsedData.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30px]">Status</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((row, idx) => (
                        <TableRow key={idx} className={!row.valid ? "bg-destructive/5" : ""}>
                          <TableCell>
                            {row.valid ? (
                              <CheckCircle className="w-4 h-4 text-success" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.category}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.location || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedData.length > 10 && (
                    <div className="p-2 text-center text-sm text-muted-foreground bg-muted/30">
                      +{parsedData.length - 10} more rows
                    </div>
                  )}
                </div>
              )}

              {/* Progress */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              {/* Results */}
              {results.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">Import Results</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.map((result, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 text-sm p-2 rounded ${
                          result.success ? "bg-success/10" : "bg-destructive/10"
                        }`}
                      >
                        {result.success ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                        <span>{result.name}</span>
                        {result.qrCreated && (
                          <Badge variant="outline" className="text-xs">
                            <QrCode className="w-3 h-3 mr-1" />
                            QR
                          </Badge>
                        )}
                        {result.error && (
                          <span className="text-destructive text-xs">{result.error}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={handleImport}
                  disabled={isImporting || validCount === 0}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import {validCount} Items
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
