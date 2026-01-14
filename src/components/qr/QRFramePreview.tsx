import { useMemo, useId } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QRDesignOptions } from "./QRDesignCustomizer";
import {
  Link2,
  MapPin,
  Mail,
  Phone,
  Wifi,
  User,
  ScanLine,
} from "lucide-react";

interface QRFramePreviewProps {
  value: string;
  options: QRDesignOptions;
  size?: number;
  logoElement?: React.ReactNode;
}

// Map preset logo IDs to actual icons
const presetLogoIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  link: Link2,
  location: MapPin,
  email: Mail,
  phone: Phone,
  wifi: Wifi,
  contact: User,
  "scan-me": ScanLine,
};

export function QRFramePreview({
  value,
  options,
  size = 200,
  logoElement,
}: QRFramePreviewProps) {
  const gradientId = useId();
  
  const {
    frameStyle,
    frameColor,
    frameText,
    frameTextColor,
    bgColor,
    fgColor,
    transparentBg,
    gradient,
    gradientColor,
    cornerColor,
    logo,
    logoPreset,
  } = options;

  const effectiveBgColor = transparentBg ? "transparent" : bgColor;

  // Determine the actual foreground color or gradient reference
  const actualFgColor = useMemo(() => {
    if (gradient && gradientColor) {
      return `url(#${gradientId})`;
    }
    return fgColor;
  }, [gradient, gradientColor, fgColor, gradientId]);

  // Calculate dimensions based on frame style
  const getFrameDimensions = () => {
    const qrSize = size;
    const padding = 16;
    
    switch (frameStyle) {
      case "none":
        return { width: qrSize, height: qrSize, qrOffset: { x: 0, y: 0 } };
      case "simple":
        return { 
          width: qrSize + padding * 2, 
          height: qrSize + padding * 2 + 32, 
          qrOffset: { x: padding, y: padding } 
        };
      case "rounded":
        return { 
          width: qrSize + padding * 2, 
          height: qrSize + padding * 2 + 32, 
          qrOffset: { x: padding, y: padding } 
        };
      case "banner-top":
        return { 
          width: qrSize + padding * 2, 
          height: qrSize + padding * 2 + 40, 
          qrOffset: { x: padding, y: padding + 40 } 
        };
      case "banner-bottom":
        return { 
          width: qrSize + padding * 2, 
          height: qrSize + padding * 2 + 40, 
          qrOffset: { x: padding, y: padding } 
        };
      case "badge":
        return { 
          width: qrSize + padding * 2 + 20, 
          height: qrSize + padding * 2 + 50, 
          qrOffset: { x: padding + 10, y: padding + 10 } 
        };
      case "ticket":
        return { 
          width: qrSize + padding * 2 + 40, 
          height: qrSize + padding * 2 + 60, 
          qrOffset: { x: padding + 20, y: padding + 20 } 
        };
      default:
        return { width: qrSize, height: qrSize, qrOffset: { x: 0, y: 0 } };
    }
  };

  const dims = getFrameDimensions();

  // Render logo - either custom, preset icon, or external element
  const renderLogo = () => {
    // Priority: external logoElement > custom logo URL > preset icon
    if (logoElement) {
      return logoElement;
    }
    
    if (logo) {
      return (
        <img
          src={logo}
          alt="QR Logo"
          className="w-10 h-10 object-contain"
          style={{ maxWidth: size * 0.25, maxHeight: size * 0.25 }}
        />
      );
    }
    
    if (logoPreset && presetLogoIcons[logoPreset]) {
      const IconComponent = presetLogoIcons[logoPreset];
      return (
        <IconComponent
          className="w-8 h-8"
          style={{ 
            color: fgColor,
            width: size * 0.15,
            height: size * 0.15,
          }}
        />
      );
    }
    
    return null;
  };

  const logoContent = renderLogo();
  const hasLogo = !!logoContent;

  const renderFrame = () => {
    switch (frameStyle) {
      case "none":
        return null;

      case "simple":
        return (
          <div
            className="absolute inset-0 flex flex-col"
            style={{ backgroundColor: effectiveBgColor }}
          >
            <div className="flex-1" />
            <div
              className="h-8 flex items-center justify-center"
              style={{ backgroundColor: frameColor }}
            >
              <span
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: frameTextColor }}
              >
                {frameText}
              </span>
            </div>
          </div>
        );

      case "rounded":
        return (
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl"
            style={{ backgroundColor: effectiveBgColor }}
          >
            <div className="flex-1" />
            <div
              className="h-8 flex items-center justify-center"
              style={{ backgroundColor: frameColor }}
            >
              <span
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: frameTextColor }}
              >
                {frameText}
              </span>
            </div>
          </div>
        );

      case "banner-top":
        return (
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-xl"
            style={{ backgroundColor: effectiveBgColor }}
          >
            <div
              className="h-10 flex items-center justify-center"
              style={{ backgroundColor: frameColor }}
            >
              <span
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: frameTextColor }}
              >
                {frameText}
              </span>
            </div>
            <div className="flex-1" />
          </div>
        );

      case "banner-bottom":
        return (
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-xl"
            style={{ backgroundColor: effectiveBgColor }}
          >
            <div className="flex-1" />
            <div
              className="h-10 flex items-center justify-center"
              style={{ backgroundColor: frameColor }}
            >
              <span
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: frameTextColor }}
              >
                {frameText}
              </span>
            </div>
          </div>
        );

      case "badge":
        return (
          <div
            className="absolute inset-0 flex flex-col items-center overflow-hidden rounded-3xl border-4"
            style={{ 
              backgroundColor: effectiveBgColor,
              borderColor: frameColor 
            }}
          >
            <div className="flex-1" />
            <div
              className="w-full h-12 flex items-center justify-center"
              style={{ backgroundColor: frameColor }}
            >
              <span
                className="text-sm font-bold tracking-wider uppercase"
                style={{ color: frameTextColor }}
              >
                {frameText}
              </span>
            </div>
          </div>
        );

      case "ticket":
        return (
          <div
            className="absolute inset-0 flex flex-col items-center overflow-hidden"
            style={{ backgroundColor: effectiveBgColor }}
          >
            {/* Ticket border with notches */}
            <div
              className="absolute inset-2 rounded-xl border-2 border-dashed"
              style={{ borderColor: frameColor }}
            />
            {/* Top decoration */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2 rounded-b-full"
              style={{ backgroundColor: frameColor }}
            />
            {/* Bottom text area */}
            <div className="flex-1" />
            <div
              className="w-full py-3 flex items-center justify-center"
              style={{ backgroundColor: frameColor }}
            >
              <span
                className="text-sm font-bold tracking-widest uppercase"
                style={{ color: frameTextColor }}
              >
                {frameText}
              </span>
            </div>
            {/* Side notches */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 rounded-r-full"
              style={{ backgroundColor: "var(--background)" }}
            />
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 rounded-l-full"
              style={{ backgroundColor: "var(--background)" }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Build image settings for logo if we have one
  const imageSettings = hasLogo
    ? {
        src: "", // We'll overlay our own logo
        height: 0,
        width: 0,
        excavate: true, // Create space in QR code for logo
      }
    : undefined;

  return (
    <div
      className="relative inline-block"
      style={{
        width: dims.width,
        height: dims.height,
      }}
    >
      {/* Frame background */}
      {renderFrame()}

      {/* QR Code */}
      <div
        className="absolute"
        style={{
          left: dims.qrOffset.x,
          top: dims.qrOffset.y,
          backgroundColor: frameStyle === "none" ? effectiveBgColor : undefined,
        }}
      >
        <div className="relative">
          {/* SVG gradient definition - needs to be in a separate SVG that wraps QRCodeSVG */}
          {gradient && gradientColor && (
            <svg width={0} height={0} style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={fgColor} />
                  <stop offset="100%" stopColor={gradientColor} />
                </linearGradient>
              </defs>
            </svg>
          )}
          
          <QRCodeSVG
            value={value || "https://example.com"}
            size={size}
            level="H"
            fgColor={gradient && gradientColor ? fgColor : fgColor}
            bgColor={effectiveBgColor === "transparent" ? "transparent" : bgColor}
            imageSettings={imageSettings}
          />
          
          {/* Overlay gradient on QR code if enabled */}
          {gradient && gradientColor && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={size}
              height={size}
              style={{ mixBlendMode: 'multiply' }}
            >
              <defs>
                <linearGradient id={`overlay-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={fgColor} />
                  <stop offset="100%" stopColor={gradientColor} />
                </linearGradient>
              </defs>
              <rect
                width={size}
                height={size}
                fill={`url(#overlay-${gradientId})`}
                opacity={0.8}
              />
            </svg>
          )}
          
          {/* Custom corner color overlay - draws colored squares over the finder patterns */}
          {cornerColor && cornerColor !== fgColor && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={size}
              height={size}
            >
              {/* Top-left finder pattern */}
              <rect
                x={0}
                y={0}
                width={size * 0.27}
                height={size * 0.27}
                fill={effectiveBgColor === "transparent" ? "white" : bgColor}
              />
              <rect
                x={size * 0.02}
                y={size * 0.02}
                width={size * 0.23}
                height={size * 0.23}
                fill={cornerColor}
                rx={options.cornerStyle === "rounded" || options.cornerStyle === "rounded-dot" ? size * 0.02 : 0}
              />
              <rect
                x={size * 0.05}
                y={size * 0.05}
                width={size * 0.17}
                height={size * 0.17}
                fill={effectiveBgColor === "transparent" ? "white" : bgColor}
                rx={options.cornerStyle === "rounded" || options.cornerStyle === "rounded-dot" ? size * 0.02 : 0}
              />
              <rect
                x={size * 0.08}
                y={size * 0.08}
                width={size * 0.11}
                height={size * 0.11}
                fill={cornerColor}
                rx={options.cornerStyle === "circle" || options.cornerStyle === "dot" || options.cornerStyle === "rounded-dot" ? size * 0.055 : options.cornerStyle === "rounded" ? size * 0.01 : 0}
              />
              
              {/* Top-right finder pattern */}
              <rect
                x={size * 0.73}
                y={0}
                width={size * 0.27}
                height={size * 0.27}
                fill={effectiveBgColor === "transparent" ? "white" : bgColor}
              />
              <rect
                x={size * 0.75}
                y={size * 0.02}
                width={size * 0.23}
                height={size * 0.23}
                fill={cornerColor}
                rx={options.cornerStyle === "rounded" || options.cornerStyle === "rounded-dot" ? size * 0.02 : 0}
              />
              <rect
                x={size * 0.78}
                y={size * 0.05}
                width={size * 0.17}
                height={size * 0.17}
                fill={effectiveBgColor === "transparent" ? "white" : bgColor}
                rx={options.cornerStyle === "rounded" || options.cornerStyle === "rounded-dot" ? size * 0.02 : 0}
              />
              <rect
                x={size * 0.81}
                y={size * 0.08}
                width={size * 0.11}
                height={size * 0.11}
                fill={cornerColor}
                rx={options.cornerStyle === "circle" || options.cornerStyle === "dot" || options.cornerStyle === "rounded-dot" ? size * 0.055 : options.cornerStyle === "rounded" ? size * 0.01 : 0}
              />
              
              {/* Bottom-left finder pattern */}
              <rect
                x={0}
                y={size * 0.73}
                width={size * 0.27}
                height={size * 0.27}
                fill={effectiveBgColor === "transparent" ? "white" : bgColor}
              />
              <rect
                x={size * 0.02}
                y={size * 0.75}
                width={size * 0.23}
                height={size * 0.23}
                fill={cornerColor}
                rx={options.cornerStyle === "rounded" || options.cornerStyle === "rounded-dot" ? size * 0.02 : 0}
              />
              <rect
                x={size * 0.05}
                y={size * 0.78}
                width={size * 0.17}
                height={size * 0.17}
                fill={effectiveBgColor === "transparent" ? "white" : bgColor}
                rx={options.cornerStyle === "rounded" || options.cornerStyle === "rounded-dot" ? size * 0.02 : 0}
              />
              <rect
                x={size * 0.08}
                y={size * 0.81}
                width={size * 0.11}
                height={size * 0.11}
                fill={cornerColor}
                rx={options.cornerStyle === "circle" || options.cornerStyle === "dot" || options.cornerStyle === "rounded-dot" ? size * 0.055 : options.cornerStyle === "rounded" ? size * 0.01 : 0}
              />
            </svg>
          )}

          {/* Logo overlay */}
          {hasLogo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="p-2 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: bgColor }}
              >
                {logoContent}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
