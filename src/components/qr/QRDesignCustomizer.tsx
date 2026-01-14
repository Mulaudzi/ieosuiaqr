import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Square, 
  Circle, 
  Star, 
  Diamond, 
  Plus,
  X,
  Link2,
  MapPin,
  Mail,
  Phone,
  Wifi,
  User,
  Image
} from "lucide-react";
import { TemplateGallery } from "./TemplateGallery";
import { DesignPresetManager } from "./DesignPresetManager";

export interface QRDesignOptions {
  // Shape
  shapeStyle: "squares" | "dots" | "rounded" | "classy" | "classy-rounded" | "extra-rounded" | "fluid" | "edge-cut";
  bgColor: string;
  fgColor: string;
  transparentBg: boolean;
  gradient: boolean;
  gradientColor?: string;
  
  // Border/Corner
  cornerStyle: "square" | "rounded" | "circle" | "leaf" | "dot" | "rounded-dot" | "flower" | "classy";
  cornerColor: string;
  
  // Center
  centerStyle: "square" | "rounded" | "circle" | "dot" | "star" | "diamond" | "plus" | "none";
  centerColor: string;
  
  // Frame
  frameStyle: "none" | "simple" | "rounded" | "banner-top" | "banner-bottom" | "badge" | "ticket";
  frameColor: string;
  frameText: string;
  frameTextColor: string;
  
  // Logo
  logo: string | null;
  logoPreset: string | null;
}

export const defaultDesignOptions: QRDesignOptions = {
  shapeStyle: "squares",
  bgColor: "#FFFFFF",
  fgColor: "#000000",
  transparentBg: false,
  gradient: false,
  gradientColor: "#1B9AAA",
  cornerStyle: "square",
  cornerColor: "#000000",
  centerStyle: "square",
  centerColor: "#000000",
  frameStyle: "none",
  frameColor: "#1B9AAA",
  frameText: "SCAN ME",
  frameTextColor: "#FFFFFF",
  logo: null,
  logoPreset: null,
};

const shapeStyles = [
  { id: "squares", name: "Classic" },
  { id: "dots", name: "Dots" },
  { id: "rounded", name: "Rounded" },
  { id: "classy", name: "Classy" },
  { id: "classy-rounded", name: "Classy Rounded" },
  { id: "extra-rounded", name: "Extra Rounded" },
  { id: "fluid", name: "Fluid" },
  { id: "edge-cut", name: "Edge Cut" },
];

const cornerStyles = [
  { id: "square", icon: Square, name: "Square" },
  { id: "rounded", icon: Square, name: "Rounded" },
  { id: "circle", icon: Circle, name: "Circle" },
  { id: "leaf", icon: Square, name: "Leaf" },
  { id: "dot", icon: Circle, name: "Dot" },
  { id: "rounded-dot", icon: Circle, name: "Rounded Dot" },
  { id: "flower", icon: Star, name: "Flower" },
  { id: "classy", icon: Square, name: "Classy" },
];

const centerStyles = [
  { id: "square", icon: Square, name: "Square" },
  { id: "rounded", icon: Square, name: "Rounded" },
  { id: "circle", icon: Circle, name: "Circle" },
  { id: "dot", icon: Circle, name: "Dot" },
  { id: "star", icon: Star, name: "Star" },
  { id: "diamond", icon: Diamond, name: "Diamond" },
  { id: "plus", icon: Plus, name: "Plus" },
  { id: "none", icon: X, name: "None" },
];

const frameStyles = [
  { id: "none", name: "No Frame" },
  { id: "simple", name: "Simple" },
  { id: "rounded", name: "Rounded" },
  { id: "banner-top", name: "Banner Top" },
  { id: "banner-bottom", name: "Banner Bottom" },
  { id: "badge", name: "Badge" },
  { id: "ticket", name: "Ticket" },
];

const presetLogos = [
  { id: "none", icon: X, name: "None" },
  { id: "link", icon: Link2, name: "Link" },
  { id: "location", icon: MapPin, name: "Location" },
  { id: "email", icon: Mail, name: "Email" },
  { id: "phone", icon: Phone, name: "Phone" },
  { id: "wifi", icon: Wifi, name: "WiFi" },
  { id: "contact", icon: User, name: "Contact" },
  { id: "scan-me", icon: Image, name: "Scan Me" },
];

interface QRDesignCustomizerProps {
  options: QRDesignOptions;
  onChange: (options: QRDesignOptions) => void;
  isPro?: boolean;
  onUpgradeClick?: () => void;
}

export function QRDesignCustomizer({
  options,
  onChange,
  isPro = false,
  onUpgradeClick,
}: QRDesignCustomizerProps) {
  const [activeTab, setActiveTab] = useState("shape");

  const updateOption = <K extends keyof QRDesignOptions>(
    key: K,
    value: QRDesignOptions[K]
  ) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Quick Start Section */}
      <div className="space-y-3">
        <TemplateGallery onSelectTemplate={onChange} currentOptions={options} />
        
        {isPro && (
          <>
            <Separator />
            <DesignPresetManager
              currentOptions={options}
              onLoadPreset={onChange}
              isPro={isPro}
            />
          </>
        )}
      </div>

      <Separator />

      {/* Manual Customization */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="frame">Frame</TabsTrigger>
          <TabsTrigger value="shape">Shape</TabsTrigger>
          <TabsTrigger value="corners">Corners</TabsTrigger>
          <TabsTrigger value="logo">Logo</TabsTrigger>
        </TabsList>

        {/* Frame Tab */}
        <TabsContent value="frame" className="space-y-4 pt-4">
          <div>
            <Label className="mb-3 block">Frame Style</Label>
            <div className="grid grid-cols-4 gap-2">
              {frameStyles.map((frame) => (
                <button
                  key={frame.id}
                  onClick={() => updateOption("frameStyle", frame.id as QRDesignOptions["frameStyle"])}
                  className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                    options.frameStyle === frame.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {frame.name}
                </button>
              ))}
            </div>
          </div>

          {options.frameStyle !== "none" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frame-color">Frame Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="frame-color"
                      type="color"
                      value={options.frameColor}
                      onChange={(e) => updateOption("frameColor", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={options.frameColor}
                      onChange={(e) => updateOption("frameColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frame-text-color">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="frame-text-color"
                      type="color"
                      value={options.frameTextColor}
                      onChange={(e) => updateOption("frameTextColor", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={options.frameTextColor}
                      onChange={(e) => updateOption("frameTextColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frame-text">Frame Text</Label>
                <Input
                  id="frame-text"
                  placeholder="SCAN ME"
                  value={options.frameText}
                  onChange={(e) => updateOption("frameText", e.target.value)}
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">Max 20 characters</p>
              </div>
            </>
          )}
        </TabsContent>

        {/* Shape Tab */}
        <TabsContent value="shape" className="space-y-4 pt-4">
          <div>
            <Label className="mb-3 block">Shape Style</Label>
            <div className="grid grid-cols-4 gap-2">
              {shapeStyles.map((shape) => (
                <button
                  key={shape.id}
                  onClick={() => updateOption("shapeStyle", shape.id as QRDesignOptions["shapeStyle"])}
                  className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                    options.shapeStyle === shape.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {shape.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bg-color">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="bg-color"
                  type="color"
                  value={options.bgColor}
                  onChange={(e) => updateOption("bgColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                  disabled={options.transparentBg}
                />
                <Input
                  value={options.bgColor}
                  onChange={(e) => updateOption("bgColor", e.target.value)}
                  className="flex-1"
                  disabled={options.transparentBg}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fg-color">Shape Color</Label>
              <div className="flex gap-2">
                <Input
                  id="fg-color"
                  type="color"
                  value={options.fgColor}
                  onChange={(e) => updateOption("fgColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={options.fgColor}
                  onChange={(e) => updateOption("fgColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="transparent-bg" className="cursor-pointer">Transparent Background</Label>
              <p className="text-xs text-muted-foreground">For overlays on images</p>
            </div>
            <Switch
              id="transparent-bg"
              checked={options.transparentBg}
              onCheckedChange={(checked) => updateOption("transparentBg", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="gradient" className="cursor-pointer">Gradient Colors</Label>
              <p className="text-xs text-muted-foreground">Apply gradient to QR pattern</p>
            </div>
            <Switch
              id="gradient"
              checked={options.gradient}
              onCheckedChange={(checked) => updateOption("gradient", checked)}
            />
          </div>

          {options.gradient && (
            <div className="space-y-2">
              <Label htmlFor="gradient-color">Gradient End Color</Label>
              <div className="flex gap-2">
                <Input
                  id="gradient-color"
                  type="color"
                  value={options.gradientColor}
                  onChange={(e) => updateOption("gradientColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={options.gradientColor}
                  onChange={(e) => updateOption("gradientColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Corners Tab */}
        <TabsContent value="corners" className="space-y-4 pt-4">
          <div>
            <Label className="mb-3 block">Corner Finder Style</Label>
            <div className="grid grid-cols-4 gap-2">
              {cornerStyles.map((corner) => (
                <button
                  key={corner.id}
                  onClick={() => updateOption("cornerStyle", corner.id as QRDesignOptions["cornerStyle"])}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                    options.cornerStyle === corner.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <corner.icon className={`w-5 h-5 ${options.cornerStyle === corner.id ? "text-primary" : ""}`} />
                  <span className="text-xs">{corner.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="corner-color">Corner Color</Label>
            <div className="flex gap-2">
              <Input
                id="corner-color"
                type="color"
                value={options.cornerColor}
                onChange={(e) => updateOption("cornerColor", e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={options.cornerColor}
                onChange={(e) => updateOption("cornerColor", e.target.value)}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave same as shape color for uniform look
            </p>
          </div>

          <div>
            <Label className="mb-3 block">Center Dot Style</Label>
            <div className="grid grid-cols-4 gap-2">
              {centerStyles.map((center) => (
                <button
                  key={center.id}
                  onClick={() => updateOption("centerStyle", center.id as QRDesignOptions["centerStyle"])}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                    options.centerStyle === center.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <center.icon className={`w-5 h-5 ${options.centerStyle === center.id ? "text-primary" : ""}`} />
                  <span className="text-xs">{center.name}</span>
                </button>
              ))}
            </div>
          </div>

          {options.centerStyle !== "none" && (
            <div className="space-y-2">
              <Label htmlFor="center-color">Center Color</Label>
              <div className="flex gap-2">
                <Input
                  id="center-color"
                  type="color"
                  value={options.centerColor}
                  onChange={(e) => updateOption("centerColor", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={options.centerColor}
                  onChange={(e) => updateOption("centerColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Logo Tab */}
        <TabsContent value="logo" className="space-y-4 pt-4">
          <div>
            <Label className="mb-3 block">Preset Icons</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Quick icons that match your QR code type
            </p>
            <div className="grid grid-cols-4 gap-2">
              {presetLogos.map((logo) => (
                <button
                  key={logo.id}
                  onClick={() => updateOption("logoPreset", logo.id === "none" ? null : logo.id)}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                    (options.logoPreset === logo.id) || (logo.id === "none" && !options.logoPreset && !options.logo)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <logo.icon className={`w-5 h-5 ${options.logoPreset === logo.id ? "text-primary" : ""}`} />
                  <span className="text-xs">{logo.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or upload custom</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Use the logo uploader below to add your own brand logo
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
