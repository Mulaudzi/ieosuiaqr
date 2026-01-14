import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Bookmark,
  BookmarkPlus,
  ChevronDown,
  Edit2,
  Loader2,
  MoreHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { designPresetApi, DesignPreset } from "@/services/api/designPresets";
import { QRDesignOptions } from "./QRDesignCustomizer";
import { QRFramePreview } from "./QRFramePreview";

interface DesignPresetManagerProps {
  currentOptions: QRDesignOptions;
  onLoadPreset: (options: QRDesignOptions) => void;
  isPro?: boolean;
}

export function DesignPresetManager({
  currentOptions,
  onLoadPreset,
  isPro = false,
}: DesignPresetManagerProps) {
  const [presets, setPresets] = useState<DesignPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<DesignPreset | null>(null);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const { toast } = useToast();

  const fetchPresets = useCallback(async () => {
    if (!isPro) return;
    
    setIsLoading(true);
    try {
      const response = await designPresetApi.list();
      if (response.success && response.data) {
        setPresets(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch presets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isPro]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter a name for your preset.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await designPresetApi.create({
        name: presetName,
        description: presetDescription || undefined,
        design_options: currentOptions,
        is_default: presets.length === 0,
      });

      if (response.success && response.data) {
        setPresets((prev) => [...prev, response.data]);
        toast({
          title: "Preset saved!",
          description: "Your design preset has been saved.",
        });
        setSaveDialogOpen(false);
        setPresetName("");
        setPresetDescription("");
      }
    } catch (error) {
      console.error("Failed to save preset:", error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Could not save preset. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePreset = async () => {
    if (!presetToDelete) return;

    try {
      const response = await designPresetApi.delete(presetToDelete.id);
      if (response.success) {
        setPresets((prev) => prev.filter((p) => p.id !== presetToDelete.id));
        toast({
          title: "Preset deleted",
          description: "The design preset has been removed.",
        });
      }
    } catch (error) {
      console.error("Failed to delete preset:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Could not delete preset. Please try again.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPresetToDelete(null);
    }
  };

  const handleSetDefault = async (preset: DesignPreset) => {
    try {
      const response = await designPresetApi.setDefault(preset.id);
      if (response.success) {
        setPresets((prev) =>
          prev.map((p) => ({
            ...p,
            is_default: p.id === preset.id,
          }))
        );
        toast({
          title: "Default updated",
          description: `"${preset.name}" is now your default preset.`,
        });
      }
    } catch (error) {
      console.error("Failed to set default:", error);
    }
  };

  const handleLoadPreset = (preset: DesignPreset) => {
    onLoadPreset(preset.design_options);
    toast({
      title: "Preset applied",
      description: `"${preset.name}" has been applied.`,
    });
  };

  if (!isPro) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          My Presets
        </Label>
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <BookmarkPlus className="w-4 h-4 mr-1" />
              Save Current
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Design Preset</DialogTitle>
              <DialogDescription>
                Save your current design as a reusable preset for future QR codes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="bg-muted rounded-lg p-2">
                  <QRFramePreview
                    value="https://example.com"
                    options={currentOptions}
                    size={80}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="preset-name">Preset Name *</Label>
                    <Input
                      id="preset-name"
                      placeholder="e.g., My Brand Style"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preset-desc">Description (optional)</Label>
                    <Textarea
                      id="preset-desc"
                      placeholder="Describe this preset..."
                      value={presetDescription}
                      onChange={(e) => setPresetDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePreset} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preset"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : presets.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No saved presets yet. Save your first design preset above.
        </p>
      ) : (
        <ScrollArea className="h-[200px]">
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onLoad={() => handleLoadPreset(preset)}
                onSetDefault={() => handleSetDefault(preset)}
                onDelete={() => {
                  setPresetToDelete(preset);
                  setDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{presetToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePreset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PresetCard({
  preset,
  onLoad,
  onSetDefault,
  onDelete,
}: {
  preset: DesignPreset;
  onLoad: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="relative p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-all cursor-pointer group"
      onClick={onLoad}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: preset.design_options.bgColor }}
        >
          <div
            className="w-6 h-6 rounded-sm"
            style={{ backgroundColor: preset.design_options.fgColor }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-medium text-sm truncate">{preset.name}</p>
            {preset.is_default && (
              <Star className="w-3 h-3 text-primary fill-primary flex-shrink-0" />
            )}
          </div>
          {preset.description && (
            <p className="text-xs text-muted-foreground truncate">{preset.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLoad(); }}>
              Apply preset
            </DropdownMenuItem>
            {!preset.is_default && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSetDefault(); }}>
                <Star className="w-4 h-4 mr-2" />
                Set as default
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
