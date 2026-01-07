import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { qrCodeApi } from "@/services/api";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Download,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CSVRow {
  type: string;
  name: string;
  content: string;
  valid: boolean;
  error?: string;
}

interface BulkCSVImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const VALID_TYPES = ["url", "text", "email", "phone", "sms", "wifi", "vcard", "event", "location"];

export function BulkCSVImport({ open, onOpenChange, onSuccess }: BulkCSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CSVRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
    const typeIndex = headers.indexOf("type");
    const nameIndex = headers.indexOf("name");
    const contentIndex = headers.indexOf("content");

    if (typeIndex === -1 || contentIndex === -1) {
      setError("CSV must have 'type' and 'content' columns. 'name' is optional.");
      return [];
    }

    return lines.slice(1).map((line, idx) => {
      const values = line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
      const type = values[typeIndex]?.toLowerCase() || "";
      const name = nameIndex !== -1 ? values[nameIndex] || `QR Code ${idx + 1}` : `QR Code ${idx + 1}`;
      const content = values[contentIndex] || "";

      let valid = true;
      let errorMsg: string | undefined;

      if (!VALID_TYPES.includes(type)) {
        valid = false;
        errorMsg = `Invalid type: ${type}`;
      } else if (!content) {
        valid = false;
        errorMsg = "Content is required";
      } else if (type === "url" && !content.match(/^https?:\/\/.+/)) {
        valid = false;
        errorMsg = "Invalid URL format";
      } else if (type === "email" && !content.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        valid = false;
        errorMsg = "Invalid email format";
      }

      return { type, name, content, valid, error: errorMsg };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setResult(null);
    setParsedRows([]);

    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB.");
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      setParsedRows(rows);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || parsedRows.length === 0) return;

    const validRows = parsedRows.filter(r => r.valid);
    if (validRows.length === 0) {
      setError("No valid rows to import.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await qrCodeApi.bulkImportCSV(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setResult({
        created: response.data.created,
        failed: response.data.failed,
      });

      toast({
        title: "Import complete!",
        description: `Created ${response.data.created} QR codes. ${response.data.failed} failed.`,
      });

      if (response.data.created > 0) {
        onSuccess();
      }
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || "Import failed. Please try again.");
      toast({
        title: "Import failed",
        description: apiError.message || "Please check your CSV and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedRows([]);
    setError(null);
    setResult(null);
    setUploadProgress(0);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = `type,name,content
url,Company Website,https://example.com
email,Contact Email,contact@example.com
phone,Support Hotline,+27123456789
text,Welcome Message,Welcome to our store!
wifi,Office WiFi,MySSID:MyPassword:WPA`;
    
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedRows.filter(r => r.valid).length;
  const invalidCount = parsedRows.filter(r => !r.valid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Bulk CSV Import
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple QR codes at once. Enterprise feature.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Result */}
          {result && (
            <Alert className="border-success bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                Successfully created {result.created} QR codes. {result.failed > 0 && `${result.failed} failed.`}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Area */}
          {!file && !result && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium mb-1">Drop your CSV file here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
                <Button variant="outline" size="sm">
                  Select File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="flex items-center justify-center">
                <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && !result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="gap-1">
                    <FileSpreadsheet className="w-3 h-3" />
                    {file?.name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {parsedRows.length} rows
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-success">
                    {validCount} valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive">
                      {invalidCount} invalid
                    </Badge>
                  )}
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 50).map((row, idx) => (
                      <TableRow key={idx} className={!row.valid ? "bg-destructive/5" : ""}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {row.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {row.name}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate font-mono text-xs">
                          {row.content}
                        </TableCell>
                        <TableCell>
                          {row.valid ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <span className="flex items-center gap-1 text-destructive text-xs">
                              <X className="w-3 h-3" />
                              {row.error}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {parsedRows.length > 50 && (
                <p className="text-sm text-center text-muted-foreground">
                  Showing first 50 of {parsedRows.length} rows
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {parsedRows.length > 0 && !result && (
            <Button
              variant="hero"
              onClick={handleUpload}
              disabled={isUploading || validCount === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {validCount} QR Codes
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
