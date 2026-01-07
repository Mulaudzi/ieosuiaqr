import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  ArrowLeft,
  Link2,
  Mail,
  Phone,
  Wifi,
  User,
  Calendar,
  MessageSquare,
  MapPin,
  ChevronRight,
  Download,
  Palette,
  Crown,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const qrTypes = [
  { id: "url", name: "URL", icon: Link2, description: "Link to any website" },
  { id: "text", name: "Text", icon: MessageSquare, description: "Plain text message" },
  { id: "email", name: "Email", icon: Mail, description: "Email with subject & body" },
  { id: "phone", name: "Phone", icon: Phone, description: "Phone number to call" },
  { id: "wifi", name: "WiFi", icon: Wifi, description: "WiFi network credentials", premium: true },
  { id: "vcard", name: "vCard", icon: User, description: "Contact information", premium: true },
  { id: "event", name: "Event", icon: Calendar, description: "Calendar event", premium: true },
  { id: "location", name: "Location", icon: MapPin, description: "Geographic location", premium: true },
];

const colorPresets = [
  { fg: "#000000", bg: "#FFFFFF", name: "Classic" },
  { fg: "#1B9AAA", bg: "#FFFFFF", name: "Teal" },
  { fg: "#7C3AED", bg: "#FFFFFF", name: "Purple" },
  { fg: "#059669", bg: "#FFFFFF", name: "Green" },
  { fg: "#DC2626", bg: "#FFFFFF", name: "Red" },
  { fg: "#0D1117", bg: "#F6F8FA", name: "GitHub" },
];

export default function CreateQRCode() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState("url");
  const [qrName, setQrName] = useState("");
  const [qrContent, setQrContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorPresets[0]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const selectedTypeInfo = qrTypes.find((t) => t.id === selectedType);

  const getQRValue = () => {
    switch (selectedType) {
      case "url":
        return qrContent || "https://example.com";
      case "email":
        return `mailto:${qrContent}`;
      case "phone":
        return `tel:${qrContent}`;
      default:
        return qrContent || "https://ieosuia.com";
    }
  };

  const handleCreate = () => {
    if (!qrName.trim()) {
      toast({
        title: "Name required",
        description: "Please give your QR code a name",
        variant: "destructive",
      });
      return;
    }
    if (!qrContent.trim()) {
      toast({
        title: "Content required",
        description: "Please enter the QR code content",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "QR Code created!",
      description: "Your QR code has been created successfully.",
    });

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold">Create QR Code</h1>
              <p className="text-sm text-muted-foreground">
                Step {step} of 3
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button variant="hero" onClick={() => setStep(step + 1)}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleCreate}>
                Create QR Code
                <Check className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "33.33%" }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left - Form */}
          <div>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="font-display text-2xl font-bold mb-2">
                    Choose QR Code Type
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Select the type of content you want to encode
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {qrTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => !type.premium && setSelectedType(type.id)}
                        disabled={type.premium}
                        className={`relative p-5 rounded-2xl border text-left transition-all ${
                          selectedType === type.id
                            ? "border-primary bg-primary/5"
                            : type.premium
                            ? "border-border bg-muted/50 opacity-60"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {type.premium && (
                          <div className="absolute top-3 right-3">
                            <Crown className="w-4 h-4 text-warning" />
                          </div>
                        )}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                            selectedType === type.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <type.icon className="w-5 h-5" />
                        </div>
                        <p className="font-semibold mb-1">{type.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                        {type.premium && (
                          <p className="text-xs text-warning mt-2">Pro feature</p>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="font-display text-2xl font-bold mb-2">
                    Enter Content
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Fill in the details for your {selectedTypeInfo?.name} QR code
                  </p>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">QR Code Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., My Website QR"
                        value={qrName}
                        onChange={(e) => setQrName(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        A friendly name to identify this QR code
                      </p>
                    </div>

                    {selectedType === "url" && (
                      <div className="space-y-2">
                        <Label htmlFor="url">Website URL</Label>
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://example.com"
                          value={qrContent}
                          onChange={(e) => setQrContent(e.target.value)}
                        />
                      </div>
                    )}

                    {selectedType === "text" && (
                      <div className="space-y-2">
                        <Label htmlFor="text">Text Content</Label>
                        <Textarea
                          id="text"
                          placeholder="Enter your text message..."
                          rows={5}
                          value={qrContent}
                          onChange={(e) => setQrContent(e.target.value)}
                        />
                      </div>
                    )}

                    {selectedType === "email" && (
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="contact@example.com"
                          value={qrContent}
                          onChange={(e) => setQrContent(e.target.value)}
                        />
                      </div>
                    )}

                    {selectedType === "phone" && (
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 234 567 8900"
                          value={qrContent}
                          onChange={(e) => setQrContent(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="font-display text-2xl font-bold mb-2">
                    Customize Design
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Choose colors for your QR code
                  </p>

                  <div className="space-y-6">
                    <div>
                      <Label className="mb-3 block">Color Presets</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {colorPresets.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => setSelectedColor(color)}
                            className={`p-4 rounded-xl border transition-all ${
                              selectedColor.name === color.name
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div
                              className="w-8 h-8 rounded-lg mx-auto mb-2"
                              style={{ backgroundColor: color.fg }}
                            />
                            <p className="text-xs font-medium">{color.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/50 border border-dashed border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <Palette className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Custom Colors</span>
                        <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                          Pro
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Upgrade to Pro to use custom colors, add logos, and more
                        customization options.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right - Preview */}
          <div className="lg:sticky lg:top-32 h-fit">
            <div className="p-8 rounded-3xl bg-card border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-semibold">Preview</h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <div
                className="rounded-2xl p-8 flex items-center justify-center mb-6"
                style={{ backgroundColor: selectedColor.bg }}
              >
                <QRCodeSVG
                  value={getQRValue()}
                  size={200}
                  level="H"
                  fgColor={selectedColor.fg}
                  bgColor={selectedColor.bg}
                  className="w-full h-auto max-w-[200px]"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{selectedTypeInfo?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{qrName || "Untitled"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Content</span>
                  <span className="font-medium truncate max-w-[150px]">
                    {qrContent || "Not set"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
