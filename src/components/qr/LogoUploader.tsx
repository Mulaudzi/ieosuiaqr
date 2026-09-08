import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Loader2, X, Info } from "lucide-react";
import { uploadFile, get } from "@/services/api/client";

interface UserLogo {
  id: string;
  logo_path: string;
  preview_thumb?: string;
  name?: string;
}

interface LogoUploaderProps {
  selectedLogo: string | null;
  onSelectLogo: (logoPath: string | null) => void;
}

export function LogoUploader({ selectedLogo, onSelectLogo }: LogoUploaderProps) {
  const [logos, setLogos] = useState<UserLogo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchLogos = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await get<{ success: boolean; data: UserLogo[] }>("/user/logos");
      if (response.success && response.data) {
        setLogos(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch logos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadLogoFile = async (file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.includes("png")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PNG file for best results.",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Logo must be less than 2MB.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      
      const response = await uploadFile<{ success: boolean; data: { logo_path: string; id: string } }>(
        "/user/logos",
        formData
      );
      
      if (response.success && response.data) {
        setLogos((prev) => [...prev, { id: response.data.id, logo_path: response.data.logo_path }]);
        onSelectLogo(response.data.logo_path);
        toast({
          title: "Logo uploaded!",
          description: "Your logo has been saved and selected.",
        });
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Could not upload logo. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    await uploadLogoFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (isUploading) return;
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0] || null;
    await uploadLogoFile(file);
  };

  const handleRemoveLogo = () => {
    onSelectLogo(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          <Label className="font-medium">Custom Logo</Label>
        </div>
        {selectedLogo && (
          <Button variant="ghost" size="sm" onClick={handleRemoveLogo}>
            <X className="w-4 h-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {selectedLogo ? (
        <div
          className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "bg-muted/50 border-border"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center overflow-hidden">
            <img
              src={selectedLogo}
              alt="Selected logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Logo selected</p>
            <p className="text-xs text-muted-foreground">
              Will be centered on your QR code. Drag and drop a PNG here to replace it.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={fetchLogos}>
                Change
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Logo</DialogTitle>
                <DialogDescription>
                  Choose from your saved logos or upload a new one.
                </DialogDescription>
              </DialogHeader>
              <LogoSelector
                logos={logos}
                isLoading={isLoading}
                isUploading={isUploading}
                onSelect={(path) => {
                  onSelectLogo(path);
                  setDialogOpen(false);
                }}
                onUpload={handleUpload}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-24 border-dashed"
              onClick={fetchLogos}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isDragActive ? "Drop PNG logo here" : "Click or drag a PNG logo here"}
                </span>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Logo to QR Code</DialogTitle>
              <DialogDescription>
                Select from saved logos or upload a new one.
              </DialogDescription>
            </DialogHeader>
            <LogoSelector
              logos={logos}
              isLoading={isLoading}
              isUploading={isUploading}
              onSelect={(path) => {
                onSelectLogo(path);
                setDialogOpen(false);
              }}
              onUpload={handleUpload}
            />
          </DialogContent>
        </Dialog>
      )}

      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          For best scannability, use a 100x100px PNG with transparent background.
          Logo will be centered without obstructing QR data (high error correction used).
        </p>
      </div>
    </div>
  );
}

function LogoSelector({
  logos,
  isLoading,
  isUploading,
  onSelect,
  onUpload,
}: {
  logos: UserLogo[];
  isLoading: boolean;
  isUploading: boolean;
  onSelect: (path: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Saved Logos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : logos.length > 0 ? (
        <div className="grid grid-cols-4 gap-3">
          {logos.map((logo) => (
            <button
              key={logo.id}
              onClick={() => onSelect(logo.logo_path)}
              className="aspect-square rounded-xl bg-white border border-border hover:border-primary hover:ring-2 hover:ring-primary/20 transition-all p-2 flex items-center justify-center"
            >
              <img
                src={logo.preview_thumb || logo.logo_path}
                alt="Logo"
                className="max-w-full max-h-full object-contain"
              />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No saved logos yet. Upload your first logo below.
        </p>
      )}

      {/* Upload New */}
      <div className="relative">
        <Input
          type="file"
          accept="image/png"
          onChange={onUpload}
          disabled={isUploading}
          className="absolute inset-0 opacity-0 cursor-pointer"
          id="logo-upload"
        />
        <Label
          htmlFor="logo-upload"
          className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                  Upload new logo (PNG, max 2MB)
              </span>
            </>
          )}
        </Label>
      </div>
    </div>
  );
}
