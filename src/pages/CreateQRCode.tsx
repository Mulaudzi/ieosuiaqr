import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
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
  Check,
  FileImage,
  FileText,
  FileCode,
  Loader2,
  Share2,
  Smartphone,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useToast } from "@/hooks/use-toast";
import { useQRDownload, DownloadFormat } from "@/hooks/useQRDownload";
import { useQRStorage } from "@/hooks/useQRStorage";
import { LogoUploader } from "@/components/qr/LogoUploader";
import { WiFiForm, WiFiData, generateWiFiString } from "@/components/qr/WiFiForm";
import { VCardForm, VCardData, generateVCardString } from "@/components/qr/VCardForm";
import { EventForm, EventData, generateEventString } from "@/components/qr/EventForm";
import { LocationForm, LocationData, generateLocationString } from "@/components/qr/LocationForm";
import { SMSForm, SMSData, generateSMSString } from "@/components/qr/SMSForm";
import { WhatsAppForm, WhatsAppData, generateWhatsAppString } from "@/components/qr/WhatsAppForm";
import { SocialMediaForm, SocialMediaData, generateSocialMediaString } from "@/components/qr/SocialMediaForm";
import { AppForm, AppData, generateAppString } from "@/components/qr/AppForm";
import { QRDesignCustomizer, QRDesignOptions, defaultDesignOptions } from "@/components/qr/QRDesignCustomizer";
import { QRFramePreview } from "@/components/qr/QRFramePreview";
import { qrCodeApi } from "@/services/api/qrcodes";

const qrTypes = [
  { id: "url", name: "URL", icon: Link2, description: "Link to any website" },
  { id: "text", name: "Text", icon: MessageSquare, description: "Plain text message" },
  { id: "email", name: "Email", icon: Mail, description: "Email with subject & body" },
  { id: "phone", name: "Phone", icon: Phone, description: "Phone number to call" },
  { id: "sms", name: "SMS", icon: MessageSquare, description: "Text message" },
  { id: "whatsapp", name: "WhatsApp", icon: Share2, description: "WhatsApp chat" },
  { id: "wifi", name: "WiFi", icon: Wifi, description: "WiFi network credentials" },
  { id: "vcard", name: "vCard", icon: User, description: "Contact information" },
  { id: "event", name: "Event", icon: Calendar, description: "Calendar event" },
  { id: "location", name: "Location", icon: MapPin, description: "Geographic location" },
  { id: "social", name: "Social Media", icon: Share2, description: "Social profiles" },
  { id: "app", name: "App Store", icon: Smartphone, description: "App download links" },
];

const defaultWiFiData: WiFiData = { ssid: "", password: "", encryption: "WPA" };
const defaultVCardData: VCardData = {
  fullName: "",
  phone: "",
  email: "",
  organization: "",
  title: "",
  address: "",
  website: "",
};
const defaultEventData: EventData = {
  title: "",
  description: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  location: "",
};
const defaultLocationData: LocationData = {
  latitude: "",
  longitude: "",
  address: "",
  inputMode: "coordinates",
};
const defaultSMSData: SMSData = { phoneNumber: "", message: "" };
const defaultWhatsAppData: WhatsAppData = { phoneNumber: "", message: "" };
const defaultSocialMediaData: SocialMediaData = { links: [{ platform: "", url: "" }] };
const defaultAppData: AppData = { appStoreUrl: "", playStoreUrl: "", linkType: "both" };

export default function CreateQRCode() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState("url");
  const [qrName, setQrName] = useState("");
  const [qrContent, setQrContent] = useState("");
  const [designOptions, setDesignOptions] = useState<QRDesignOptions>(defaultDesignOptions);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);

  // Premium type data
  const [wifiData, setWifiData] = useState<WiFiData>(defaultWiFiData);
  const [vcardData, setVcardData] = useState<VCardData>(defaultVCardData);
  const [eventData, setEventData] = useState<EventData>(defaultEventData);
  const [locationData, setLocationData] = useState<LocationData>(defaultLocationData);
  const [smsData, setSmsData] = useState<SMSData>(defaultSMSData);
  const [whatsappData, setWhatsappData] = useState<WhatsAppData>(defaultWhatsAppData);
  const [socialData, setSocialData] = useState<SocialMediaData>(defaultSocialMediaData);
  const [appData, setAppData] = useState<AppData>(defaultAppData);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { download } = useQRDownload();
  const { refresh } = useQRStorage();
  const defaultPreviewUrl = "https://ieosuia.com";

  const handleDownload = async (format: DownloadFormat) => {
    try {
      await download(format, {
        value: getQRValue(),
        fileName: qrName || "qr-code",
        fgColor: designOptions.fgColor,
        bgColor: designOptions.transparentBg ? "transparent" : designOptions.bgColor,
        size: 400,
        designOptions: {
          ...designOptions,
          logo: selectedLogo || designOptions.logo,
        },
      });
      toast({
        title: "Downloaded!",
        description: `QR code saved as ${format.toUpperCase()}`,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[QR Create] download error", error);
      }
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not export this QR. Please try again.",
      });
    }
  };

  const selectedTypeInfo = qrTypes.find((t) => t.id === selectedType);
  const previewOptions: QRDesignOptions = {
    ...designOptions,
    logo: selectedLogo || designOptions.logo,
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
  };

  const getQRValue = (): string => {
    switch (selectedType) {
      case "url":
        return qrContent || defaultPreviewUrl;
      case "email":
        return `mailto:${qrContent}`;
      case "phone":
        return `tel:${qrContent}`;
      case "text":
        return qrContent || defaultPreviewUrl;
      case "wifi":
        return generateWiFiString(wifiData);
      case "vcard":
        return generateVCardString(vcardData);
      case "event":
        return generateEventString(eventData);
      case "location":
        return generateLocationString(locationData);
      case "sms":
        return generateSMSString(smsData);
      case "whatsapp":
        return generateWhatsAppString(whatsappData);
      case "social":
        return generateSocialMediaString(socialData);
      case "app":
        return generateAppString(appData);
      default:
        return qrContent || defaultPreviewUrl;
    }
  };

  const getContentSummary = (): string => {
    switch (selectedType) {
      case "wifi":
        return wifiData.ssid || "Not set";
      case "vcard":
        return vcardData.fullName || "Not set";
      case "event":
        return eventData.title || "Not set";
      case "location":
        return locationData.inputMode === "coordinates"
          ? locationData.latitude && locationData.longitude
            ? `${locationData.latitude}, ${locationData.longitude}`
            : "Not set"
          : locationData.address || "Not set";
      case "sms":
        return smsData.phoneNumber || "Not set";
      case "whatsapp":
        return whatsappData.phoneNumber || "Not set";
      case "social":
        return socialData.links[0]?.url || "Not set";
      case "app":
        return appData.appStoreUrl || appData.playStoreUrl || "Not set";
      default:
        return qrContent || "Not set";
    }
  };

  const validateStep2 = (): boolean => {
    if (!qrName.trim()) {
      toast({
        title: "Name required",
        description: "Please give your QR code a name",
        variant: "destructive",
      });
      return false;
    }

    switch (selectedType) {
      case "url":
      case "email":
      case "phone":
      case "text":
        if (!qrContent.trim()) {
          toast({
            title: "Content required",
            description: "Please enter the QR code content",
            variant: "destructive",
          });
          return false;
        }
        break;
      case "wifi":
        if (!wifiData.ssid.trim()) {
          toast({
            title: "SSID required",
            description: "Please enter the network name",
            variant: "destructive",
          });
          return false;
        }
        if (wifiData.encryption !== "nopass" && !wifiData.password.trim()) {
          toast({
            title: "Password required",
            description: "Please enter the WiFi password or select 'None' for encryption",
            variant: "destructive",
          });
          return false;
        }
        break;
      case "vcard":
        if (!vcardData.fullName.trim()) {
          toast({
            title: "Name required",
            description: "Please enter the contact's full name",
            variant: "destructive",
          });
          return false;
        }
        break;
      case "event": {
        if (!eventData.title.trim()) {
          toast({
            title: "Title required",
            description: "Please enter the event title",
            variant: "destructive",
          });
          return false;
        }
        if (!eventData.startDate || !eventData.startTime || !eventData.endDate || !eventData.endTime) {
          toast({
            title: "Dates required",
            description: "Please enter start and end dates/times",
            variant: "destructive",
          });
          return false;
        }
        const start = new Date(`${eventData.startDate}T${eventData.startTime}`);
        const end = new Date(`${eventData.endDate}T${eventData.endTime}`);
        if (end <= start) {
          toast({
            title: "Invalid dates",
            description: "End date/time must be after start date/time",
            variant: "destructive",
          });
          return false;
        }
        break;
      }
      case "location":
        if (locationData.inputMode === "coordinates") {
          const lat = parseFloat(locationData.latitude);
          const lng = parseFloat(locationData.longitude);
          if (isNaN(lat) || lat < -90 || lat > 90) {
            toast({
              title: "Invalid latitude",
              description: "Latitude must be between -90 and 90",
              variant: "destructive",
            });
            return false;
          }
          if (isNaN(lng) || lng < -180 || lng > 180) {
            toast({
              title: "Invalid longitude",
              description: "Longitude must be between -180 and 180",
              variant: "destructive",
            });
            return false;
          }
        } else if (!locationData.address.trim()) {
          toast({
            title: "Address required",
            description: "Please enter an address",
            variant: "destructive",
          });
          return false;
        }
        break;
      case "sms":
        if (!smsData.phoneNumber.trim()) {
          toast({
            title: "Phone number required",
            description: "Please enter a phone number for SMS",
            variant: "destructive",
          });
          return false;
        }
        break;
      case "whatsapp":
        if (!whatsappData.phoneNumber.trim()) {
          toast({
            title: "Phone number required",
            description: "Please enter a WhatsApp phone number",
            variant: "destructive",
          });
          return false;
        }
        break;
      case "social":
        if (!socialData.links.some(l => l.url.trim())) {
          toast({
            title: "Link required",
            description: "Please add at least one social media link",
            variant: "destructive",
          });
          return false;
        }
        break;
      case "app":
        if (appData.linkType === "ios" && !appData.appStoreUrl.trim()) {
          toast({
            title: "App Store URL required",
            description: "Please enter the iOS App Store URL",
            variant: "destructive",
          });
          return false;
        }
        if (appData.linkType === "android" && !appData.playStoreUrl.trim()) {
          toast({
            title: "Play Store URL required",
            description: "Please enter the Android Play Store URL",
            variant: "destructive",
          });
          return false;
        }
        if (appData.linkType === "both" && !appData.appStoreUrl.trim() && !appData.playStoreUrl.trim()) {
          toast({
            title: "App URL required",
            description: "Please enter at least one app store URL",
            variant: "destructive",
          });
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      // Build the API request with all design options
      const contentData = getContentData();
      const customOptions = {
        // Shape and colors
        shapeStyle: designOptions.shapeStyle,
        fgColor: designOptions.fgColor,
        bgColor: designOptions.transparentBg ? "transparent" : designOptions.bgColor,
        transparentBg: designOptions.transparentBg,
        gradient: designOptions.gradient,
        gradientColor: designOptions.gradientColor,
        // Corners
        cornerStyle: designOptions.cornerStyle,
        cornerColor: designOptions.cornerColor,
        // Center
        centerStyle: designOptions.centerStyle,
        centerColor: designOptions.centerColor,
        // Frame
        frameStyle: designOptions.frameStyle,
        frameColor: designOptions.frameColor,
        frameText: designOptions.frameText,
        frameTextColor: designOptions.frameTextColor,
        // Logo
        ...(selectedLogo && { logo_path: selectedLogo }),
        ...(designOptions.logoPreset && { logoPreset: designOptions.logoPreset }),
      };

      const response = await qrCodeApi.create({
        type: selectedType as "url" | "text" | "email" | "phone" | "wifi" | "vcard" | "event" | "location" | "sms" | "whatsapp" | "social" | "app",
        name: qrName,
        content: contentData,
        custom_options: customOptions,
      });

      if (import.meta.env.DEV) {
        console.debug("[QR Create] Request payload", {
          type: selectedType,
          name: qrName,
          content: contentData,
          custom_options: customOptions,
        });
        console.debug("[QR Create] API response", response);
      }

      if (response.success) {
        toast({
          title: "QR Code created!",
          description: "Your QR code has been saved successfully.",
        });

        // Refresh the QR list
        await refresh();
        
        navigate("/dashboard");
      } else {
        throw new Error(response.message || "Failed to create QR code");
      }
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        message?: string;
        errors?: Record<string, string[] | string>;
        data?: unknown;
      };

      const details = err.errors
        ? Object.entries(err.errors)
            .map(([field, messages]) => {
              const joined = Array.isArray(messages) ? messages.join(", ") : String(messages);
              return `${field}: ${joined}`;
            })
            .join(" | ")
        : undefined;

      const exactMessage = details || err.message || "Could not create QR code. Please try again.";
      
      // Log error for debugging (handled, so no console.error)
      if (import.meta.env.DEV) {
        console.warn("[QR Create] API error", {
          status: err.status,
          message: err.message,
          errors: err.errors,
          data: err.data,
        });
      }
      
      if (err.status === 500) {
        // Server error - provide helpful feedback
        toast({
          variant: "destructive",
          title: "Server error",
          description: exactMessage,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Creation failed",
          description: exactMessage,
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      // Confirm exit if there are unsaved changes
      if (qrName || qrContent || wifiData.ssid || vcardData.fullName) {
        setShowExitConfirm(true);
      } else {
        navigate("/dashboard");
      }
    }
  };

  const getContentData = (): Record<string, string> => {
    switch (selectedType) {
      case "wifi":
        return wifiData as unknown as Record<string, string>;
      case "vcard":
        return vcardData as unknown as Record<string, string>;
      case "event":
        return eventData as unknown as Record<string, string>;
      case "location":
        return locationData as unknown as Record<string, string>;
      case "sms":
        return smsData as unknown as Record<string, string>;
      case "whatsapp":
        return whatsappData as unknown as Record<string, string>;
      case "social":
        return { links: JSON.stringify(socialData.links) };
      case "app":
        return appData as unknown as Record<string, string>;
      default:
        return { content: qrContent };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-lg font-bold sm:text-xl">Create QR Code</h1>
              <p className="text-sm text-muted-foreground">Step {step} of 3</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button variant="hero" onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleCreate}>
                <span className="hidden sm:inline">Create QR Code</span><span className="sm:hidden">Create</span>
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
                    {qrTypes.map((type) => {
                      return (
                        <button
                          key={type.id}
                          onClick={() => handleTypeSelect(type.id)}
                          className={`relative p-5 rounded-2xl border text-left transition-all ${
                            selectedType === type.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
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
                        </button>
                      );
                    })}
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
                      <Label htmlFor="name">QR Code Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., My Website QR"
                        value={qrName}
                        onChange={(e) => setQrName(e.target.value)}
                        aria-required="true"
                      />
                      <p className="text-xs text-muted-foreground">
                        A friendly name to identify this QR code
                      </p>
                    </div>

                    {/* Basic Types */}
                    {selectedType === "url" && (
                      <div className="space-y-2">
                        <Label htmlFor="url">Website URL *</Label>
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://example.com"
                          value={qrContent}
                          onChange={(e) => setQrContent(e.target.value)}
                          aria-required="true"
                        />
                      </div>
                    )}

                    {selectedType === "text" && (
                      <div className="space-y-2">
                        <Label htmlFor="text">Text Content *</Label>
                        <Textarea
                          id="text"
                          placeholder="Enter your text message..."
                          rows={5}
                          value={qrContent}
                          onChange={(e) => setQrContent(e.target.value)}
                          aria-required="true"
                        />
                      </div>
                    )}

                    {selectedType === "email" && (
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="contact@example.com"
                          value={qrContent}
                          onChange={(e) => setQrContent(e.target.value)}
                          aria-required="true"
                        />
                      </div>
                    )}

                    {selectedType === "phone" && (
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+27 12 345 6789"
                          value={qrContent}
                          onChange={(e) => setQrContent(e.target.value)}
                          aria-required="true"
                        />
                      </div>
                    )}

                    {/* Premium Types */}
                    {selectedType === "wifi" && (
                      <WiFiForm data={wifiData} onChange={setWifiData} />
                    )}

                    {selectedType === "vcard" && (
                      <VCardForm data={vcardData} onChange={setVcardData} />
                    )}

                    {selectedType === "event" && (
                      <EventForm data={eventData} onChange={setEventData} />
                    )}

                    {selectedType === "location" && (
                      <LocationForm data={locationData} onChange={setLocationData} />
                    )}

                    {selectedType === "sms" && (
                      <SMSForm data={smsData} onChange={setSmsData} />
                    )}

                    {selectedType === "whatsapp" && (
                      <WhatsAppForm data={whatsappData} onChange={setWhatsappData} />
                    )}

                    {selectedType === "social" && (
                      <SocialMediaForm data={socialData} onChange={setSocialData} />
                    )}

                    {selectedType === "app" && (
                      <AppForm data={appData} onChange={setAppData} />
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
                    Choose colors and add your logo
                  </p>

                  <div className="space-y-6">
                    <QRDesignCustomizer
                      options={designOptions}
                      onChange={setDesignOptions}
                      isPro={true}
                    />

                    {/* Logo uploader is included free forever. */}
                    <div className="pt-4 border-t border-border">
                      <LogoUploader
                        selectedLogo={selectedLogo}
                        onSelectLogo={setSelectedLogo}
                      />
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDownload("png")}>
                      <FileImage className="w-4 h-4 mr-2" />
                      PNG Image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload("svg")}>
                      <FileCode className="w-4 h-4 mr-2" />
                      SVG Vector
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                      <FileText className="w-4 h-4 mr-2" />
                      PDF Document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="rounded-2xl p-6 flex items-center justify-center mb-6 bg-muted/30">
                <QRFramePreview
                  value={getQRValue()}
                  options={previewOptions}
                  size={180}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">
                    {selectedTypeInfo?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{qrName || "Untitled"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Content</span>
                  <span className="font-medium truncate max-w-[150px]">
                    {getContentSummary()}
                  </span>
                </div>
                {designOptions.frameStyle !== "none" && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Frame</span>
                    <span className="font-medium capitalize">{designOptions.frameStyle}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
