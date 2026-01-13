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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image, Trash2, Loader2, Info, Lock } from "lucide-react";
import { useUserPlan } from "@/hooks/useUserPlan";
import { uploadFile, get, del } from "@/services/api/client";

interface UserLogo {
  id: string;
  logo_path: string;
  preview_thumb: string;
  created_at: string;
}

interface LogoUploaderProps {
  selectedLogo: string | null;
  onLogoSelect: (logoPath: string | null) => void;
  disabled?: boolean;
}

export function LogoUploader({ selectedLogo, onLogoSelect, disabled }: LogoUploaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [logos, setLogos] = useState<UserLogo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isPro, isEnterprise, plan } = useUserPlan();

  const canUseLogo = isPro || isEnterprise;
  const maxLogos = isEnterprise ? Infinity : 10;

  const fetchLogos = async () => {
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
  };

  const handleDialogOpen = async () => {
    if (!canUseLogo) {
      toast({
        title: "Pro feature",
        description: "Upgrade to Pro to add custom logos to your QR codes.",
        variant: "destructive",
      });
      return;
    }
    setIsDialogOpen(true);
    await fetchLogos();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes("png")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG file for best results.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo must be under 1MB.",
        variant: "destructive",
      });
      return;
    }

    // Check logo limit
    if (logos.length >= maxLogos) {
      toast({
        title: "Logo limit reached",
        description: `You can only save ${maxLogos} logos. Delete one to upload a new one.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await uploadFile<{
        success: boolean;
        data: UserLogo;
        message: string;
      }>("/user/logos", formData);

      if (response.success && response.data) {
        setLogos([...logos, response.data]);
        onLogoSelect(response.data.logo_path);
        toast({
          title: "Logo uploaded",
          description: "Your logo has been saved successfully.",
        });
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteLogo = async (logoId: string) => {
    try {
      await del(`/user/logos/${logoId}`);
      setLogos(logos.filter((l) => l.id !== logoId));
      if (selectedLogo === logos.find((l) => l.id === logoId)?.logo_path) {
        onLogoSelect(null);
      }
      toast({
        title: "Logo deleted",
        description: "The logo has been removed.",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Delete failed",
        description: err.message || "Failed to delete logo.",
        variant: "destructive",
      });
    }
  };

  if (!canUseLogo) {
    return (
      <div className="p-4 rounded-2xl bg-muted/50 border border-dashed border-border">
        <div className="flex items-center gap-3 mb-3">
          <Lock className="w-5 h-5 text-warning" />
          <span className="font-medium">Custom Logo</span>
          <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
            Pro
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Upgrade to Pro to add your logo to QR codes for better brand recognition.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Image className="w-4 h-4" />
        Custom Logo
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {plan}
        </span>
      </Label>

      <div className="flex items-center gap-3">
        {selectedLogo ? (
          <div className="relative w-16 h-16 rounded-xl border border-border overflow-hidden bg-white">
            <img
              src={selectedLogo}
              alt="Selected logo"
              className="w-full h-full object-contain p-1"
            />
            <button
              onClick={() => onLogoSelect(null)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl border border-dashed border-border flex items-center justify-center bg-muted/30">
            <Image className="w-6 h-6 text-muted-foreground" />
          </div>
        )}

        <Button
          variant="outline"
          onClick={handleDialogOpen}
          disabled={disabled}
        >
          {selectedLogo ? "Change Logo" : "Add Logo"}
        </Button>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          For best scannability, use a 100x100px PNG with transparent background.
          Logo will be centered without obstructing QR data (high error correction used).
        </p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select or Upload Logo</DialogTitle>
            <DialogDescription>
              Choose from your saved logos or upload a new one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Saved logos */}
            <div>
              <Label className="mb-2 block">Your Logos</Label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : logos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No logos saved yet. Upload your first logo below.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {logos.map((logo) => (
                    <div
                      key={logo.id}
                      className={`relative aspect-square rounded-xl border-2 overflow-hidden cursor-pointer transition-all bg-white ${
                        selectedLogo === logo.logo_path
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => {
                        onLogoSelect(logo.logo_path);
                        setIsDialogOpen(false);
                      }}
                    >
                      <img
                        src={logo.preview_thumb || logo.logo_path}
                        alt="Logo"
                        className="w-full h-full object-contain p-2"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLogo(logo.id);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload new */}
            <div className="pt-4 border-t border-border">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Logo
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                PNG only, max 1MB. {logos.length}/{maxLogos === Infinity ? "∞" : maxLogos} logos used.
              </p>
            </div>

            {/* Remove logo option */}
            {selectedLogo && (
              <Button
                variant="ghost"
                onClick={() => {
                  onLogoSelect(null);
                  setIsDialogOpen(false);
                }}
                className="w-full text-muted-foreground"
              >
                Remove Logo
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
