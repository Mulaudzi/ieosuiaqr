import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Palette, Sparkles } from "lucide-react";
import { templateGallery, TemplateStyle } from "@/services/api/designPresets";
import { QRDesignOptions } from "./QRDesignCustomizer";
import { QRFramePreview } from "./QRFramePreview";

interface TemplateGalleryProps {
  onSelectTemplate: (options: QRDesignOptions) => void;
  currentOptions?: QRDesignOptions;
}

const categories = [
  { id: "all", name: "All" },
  { id: "professional", name: "Professional" },
  { id: "creative", name: "Creative" },
  { id: "minimal", name: "Minimal" },
  { id: "bold", name: "Bold" },
  { id: "seasonal", name: "Seasonal" },
];

export function TemplateGallery({ onSelectTemplate, currentOptions }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateStyle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredTemplates = selectedCategory === "all"
    ? templateGallery
    : templateGallery.filter((t) => t.category === selectedCategory);

  const handleApplyTemplate = (template: TemplateStyle) => {
    onSelectTemplate(template.design_options);
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Palette className="w-4 h-4 mr-2" />
          Browse Template Gallery
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Template Gallery
          </DialogTitle>
          <DialogDescription>
            Choose from professionally designed QR code styles. Click to preview, then apply.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-6">
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="h-[55vh] mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-1">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={previewTemplate?.id === template.id}
                  onSelect={() => setPreviewTemplate(template)}
                  onApply={() => handleApplyTemplate(template)}
                />
              ))}
            </div>
          </ScrollArea>
        </Tabs>

        {/* Preview Section */}
        {previewTemplate && (
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border mt-2">
            <div className="flex-shrink-0 bg-white rounded-lg p-3">
              <QRFramePreview
                value="https://example.com"
                options={previewTemplate.design_options}
                size={100}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold">{previewTemplate.name}</h4>
              <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
              <Badge variant="secondary" className="mt-2 capitalize">
                {previewTemplate.category}
              </Badge>
            </div>
            <Button onClick={() => handleApplyTemplate(previewTemplate)}>
              <Check className="w-4 h-4 mr-2" />
              Apply
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  template,
  isSelected,
  onSelect,
  onApply,
}: {
  template: TemplateStyle;
  isSelected: boolean;
  onSelect: () => void;
  onApply: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      onDoubleClick={onApply}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-4 rounded-xl border text-left transition-all ${
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border hover:border-primary/50 bg-card"
      }`}
    >
      {/* Color Preview Dots */}
      <div className="flex items-center gap-1 mb-3">
        <div
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: template.previewColors.primary }}
        />
        <div
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: template.previewColors.secondary }}
        />
        {template.previewColors.accent && (
          <div
            className="w-4 h-4 rounded-full border border-border"
            style={{ backgroundColor: template.previewColors.accent }}
          />
        )}
      </div>

      {/* Mini QR Preview */}
      <div
        className="w-full aspect-square rounded-lg mb-3 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: template.design_options.bgColor }}
      >
        <QRFramePreview
          value="https://qr.ieosuia.com"
          options={template.design_options}
          size={80}
        />
      </div>

      <h4 className="font-medium text-sm mb-1">{template.name}</h4>
      <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>

      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Check className="w-3 h-3" />
          </div>
        </div>
      )}
    </motion.button>
  );
}
