import { jsPDF } from "jspdf";
import QRCodeGenerator from "qrcode";
import { QRDesignOptions } from "@/components/qr/QRDesignCustomizer";

export type DownloadFormat = "png" | "svg" | "pdf";

interface DownloadOptions {
  value: string;
  fileName: string;
  fgColor: string;
  bgColor: string;
  size?: number;
  designOptions?: QRDesignOptions;
}

// Generate SVG string with custom styling
const generateStyledSVG = async (
  value: string,
  size: number,
  options: QRDesignOptions
): Promise<string> => {
  const {
    shapeStyle,
    bgColor,
    fgColor,
    transparentBg,
    gradient,
    gradientColor,
    cornerStyle,
    cornerColor,
    frameStyle,
    frameColor,
    frameText,
    frameTextColor,
    logo,
    logoPreset,
  } = options;

  const effectiveBgColor = transparentBg ? "transparent" : bgColor;
  const effectiveCornerColor = cornerColor || fgColor;

  // Generate QR matrix
  const qr = QRCodeGenerator.create(value || "https://example.com", {
    errorCorrectionLevel: "H",
  });
  const moduleCount = qr.modules.size;
  const margin = 4;
  const totalModules = moduleCount + margin * 2;
  const moduleSize = size / totalModules;
  const offset = margin * moduleSize;

  const finderPatternSize = 7;
  const finderLocations = [
    { x: 0, y: 0 },
    { x: moduleCount - finderPatternSize, y: 0 },
    { x: 0, y: moduleCount - finderPatternSize },
  ];

  const isFinderPattern = (row: number, col: number) => {
    return finderLocations.some(
      (loc) =>
        col >= loc.x &&
        col < loc.x + finderPatternSize &&
        row >= loc.y &&
        row < loc.y + finderPatternSize
    );
  };

  // Dot shape generators
  const getDotShape = (x: number, y: number, s: number, color: string): string => {
    switch (shapeStyle) {
      case "dots":
        return `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s / 2}" fill="${color}"/>`;
      case "rounded":
        return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.3}" fill="${color}"/>`;
      case "classy":
        return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.15}" fill="${color}"/>`;
      case "classy-rounded":
        return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.4}" fill="${color}"/>`;
      case "extra-rounded":
        return `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s * 0.45}" fill="${color}"/>`;
      case "fluid":
        return `<ellipse cx="${x + s / 2}" cy="${y + s / 2}" rx="${s * 0.5}" ry="${s * 0.4}" fill="${color}"/>`;
      case "edge-cut":
        return `<polygon points="${x + s * 0.2},${y} ${x + s * 0.8},${y} ${x + s},${y + s * 0.2} ${x + s},${y + s * 0.8} ${x + s * 0.8},${y + s} ${x + s * 0.2},${y + s} ${x},${y + s * 0.8} ${x},${y + s * 0.2}" fill="${color}"/>`;
      default: // squares
        return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${color}"/>`;
    }
  };

  // Finder pattern generator
  const getFinderPattern = (x: number, y: number, patternSize: number): string => {
    const middleSize = patternSize * 0.714;
    const innerSize = patternSize * 0.428;
    const middleOffset = (patternSize - middleSize) / 2;
    const innerOffset = (patternSize - innerSize) / 2;
    
    const getRadius = (baseSize: number) => {
      switch (cornerStyle) {
        case "rounded":
        case "rounded-dot":
          return baseSize * 0.2;
        case "circle":
        case "dot":
          return baseSize * 0.5;
        case "leaf":
          return baseSize * 0.3;
        case "flower":
          return baseSize * 0.4;
        default:
          return 0;
      }
    };
    
    const outerRadius = getRadius(patternSize);
    const middleRadius = getRadius(middleSize);
    const bgFill = effectiveBgColor === "transparent" ? "#FFFFFF" : effectiveBgColor;
    
    let inner = "";
    if (cornerStyle === "dot" || cornerStyle === "rounded-dot") {
      inner = `<circle cx="${x + patternSize / 2}" cy="${y + patternSize / 2}" r="${innerSize / 2}" fill="${effectiveCornerColor}"/>`;
    } else {
      const innerRadius = getRadius(innerSize);
      inner = `<rect x="${x + innerOffset}" y="${y + innerOffset}" width="${innerSize}" height="${innerSize}" rx="${innerRadius}" fill="${effectiveCornerColor}"/>`;
    }
    
    return `
      <rect x="${x}" y="${y}" width="${patternSize}" height="${patternSize}" rx="${outerRadius}" fill="${effectiveCornerColor}"/>
      <rect x="${x + middleOffset}" y="${y + middleOffset}" width="${middleSize}" height="${middleSize}" rx="${middleRadius}" fill="${bgFill}"/>
      ${inner}
    `;
  };

  // Build SVG content
  let svgContent = "";
  const gradientId = "qr-gradient";
  const dotColor = gradient && gradientColor ? `url(#${gradientId})` : fgColor;

  // Background
  if (effectiveBgColor !== "transparent") {
    svgContent += `<rect width="${size}" height="${size}" fill="${effectiveBgColor}"/>`;
  }

  // Gradient definition
  if (gradient && gradientColor) {
    svgContent = `
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${fgColor}"/>
          <stop offset="100%" stop-color="${gradientColor}"/>
        </linearGradient>
      </defs>
    ` + svgContent;
  }

  // Data modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.modules.get(row, col) && !isFinderPattern(row, col)) {
        const x = offset + col * moduleSize;
        const y = offset + row * moduleSize;
        svgContent += getDotShape(x, y, moduleSize, dotColor);
      }
    }
  }

  // Finder patterns
  for (const loc of finderLocations) {
    const x = offset + loc.x * moduleSize;
    const y = offset + loc.y * moduleSize;
    const patternSize = finderPatternSize * moduleSize;
    svgContent += getFinderPattern(x, y, patternSize);
  }

  // Add logo if present
  if (logo || logoPreset) {
    const logoSize = size * 0.2;
    const logoX = (size - logoSize) / 2;
    const logoY = (size - logoSize) / 2;
    
    // White background for logo
    svgContent += `<rect x="${logoX - 4}" y="${logoY - 4}" width="${logoSize + 8}" height="${logoSize + 8}" fill="${effectiveBgColor === 'transparent' ? '#FFFFFF' : effectiveBgColor}" rx="8"/>`;
    
    if (logo) {
      svgContent += `<image x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" href="${logo}"/>`;
    }
  }

  // Calculate frame dimensions
  let totalWidth = size;
  let totalHeight = size;
  let qrOffsetX = 0;
  let qrOffsetY = 0;
  let frameContent = "";

  if (frameStyle !== "none") {
    const padding = 16;
    const bannerHeight = 40;
    
    switch (frameStyle) {
      case "simple":
      case "rounded":
        totalWidth = size + padding * 2;
        totalHeight = size + padding * 2 + 32;
        qrOffsetX = padding;
        qrOffsetY = padding;
        frameContent = `
          <rect width="${totalWidth}" height="${totalHeight}" fill="${effectiveBgColor}" ${frameStyle === "rounded" ? 'rx="16"' : ""}/>
          <rect y="${totalHeight - 32}" width="${totalWidth}" height="32" fill="${frameColor}"/>
          <text x="${totalWidth / 2}" y="${totalHeight - 10}" text-anchor="middle" fill="${frameTextColor}" font-size="12" font-weight="bold" font-family="sans-serif">${frameText}</text>
        `;
        break;
      case "banner-top":
        totalWidth = size + padding * 2;
        totalHeight = size + padding * 2 + bannerHeight;
        qrOffsetX = padding;
        qrOffsetY = padding + bannerHeight;
        frameContent = `
          <rect width="${totalWidth}" height="${totalHeight}" fill="${effectiveBgColor}" rx="12"/>
          <rect width="${totalWidth}" height="${bannerHeight}" fill="${frameColor}" rx="12 12 0 0"/>
          <text x="${totalWidth / 2}" y="${bannerHeight / 2 + 4}" text-anchor="middle" fill="${frameTextColor}" font-size="12" font-weight="bold" font-family="sans-serif">${frameText}</text>
        `;
        break;
      case "banner-bottom":
        totalWidth = size + padding * 2;
        totalHeight = size + padding * 2 + bannerHeight;
        qrOffsetX = padding;
        qrOffsetY = padding;
        frameContent = `
          <rect width="${totalWidth}" height="${totalHeight}" fill="${effectiveBgColor}" rx="12"/>
          <rect y="${totalHeight - bannerHeight}" width="${totalWidth}" height="${bannerHeight}" fill="${frameColor}" rx="0 0 12 12"/>
          <text x="${totalWidth / 2}" y="${totalHeight - bannerHeight / 2 + 4}" text-anchor="middle" fill="${frameTextColor}" font-size="12" font-weight="bold" font-family="sans-serif">${frameText}</text>
        `;
        break;
      case "badge":
        totalWidth = size + padding * 2 + 20;
        totalHeight = size + padding * 2 + 50;
        qrOffsetX = padding + 10;
        qrOffsetY = padding + 10;
        frameContent = `
          <rect width="${totalWidth}" height="${totalHeight}" fill="${effectiveBgColor}" rx="24" stroke="${frameColor}" stroke-width="4"/>
          <rect y="${totalHeight - 48}" width="${totalWidth}" height="48" fill="${frameColor}" rx="0 0 24 24"/>
          <text x="${totalWidth / 2}" y="${totalHeight - 18}" text-anchor="middle" fill="${frameTextColor}" font-size="14" font-weight="bold" font-family="sans-serif">${frameText}</text>
        `;
        break;
      case "ticket":
        totalWidth = size + padding * 2 + 40;
        totalHeight = size + padding * 2 + 60;
        qrOffsetX = padding + 20;
        qrOffsetY = padding + 20;
        frameContent = `
          <rect width="${totalWidth}" height="${totalHeight}" fill="${effectiveBgColor}"/>
          <rect x="8" y="8" width="${totalWidth - 16}" height="${totalHeight - 16}" fill="none" stroke="${frameColor}" stroke-width="2" stroke-dasharray="4" rx="12"/>
          <rect x="${totalWidth / 2 - 32}" y="0" width="64" height="8" fill="${frameColor}" rx="0 0 4 4"/>
          <rect y="${totalHeight - 48}" width="${totalWidth}" height="48" fill="${frameColor}"/>
          <text x="${totalWidth / 2}" y="${totalHeight - 16}" text-anchor="middle" fill="${frameTextColor}" font-size="14" font-weight="bold" letter-spacing="2" font-family="sans-serif">${frameText}</text>
        `;
        break;
    }
  }

  // Wrap everything
  if (frameStyle !== "none") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
      ${frameContent}
      <g transform="translate(${qrOffsetX}, ${qrOffsetY})">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          ${svgContent}
        </svg>
      </g>
    </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${svgContent}</svg>`;
};

// Convert SVG to canvas for PNG/PDF export
const svgToCanvas = async (svgString: string, width: number, height: number): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    const img = new Image();
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };

    img.src = url;
  });
};

export function useQRDownload() {
  const downloadPNG = async ({ value, fileName, fgColor, bgColor, size = 400, designOptions }: DownloadOptions) => {
    if (designOptions) {
      const svgString = await generateStyledSVG(value, size, designOptions);
      
      // Parse SVG to get dimensions
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, "image/svg+xml");
      const svgElement = doc.querySelector("svg");
      const width = parseInt(svgElement?.getAttribute("width") || String(size));
      const height = parseInt(svgElement?.getAttribute("height") || String(size));
      
      const canvas = await svgToCanvas(svgString, width, height);
      
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } else {
      // Fallback to basic QR code
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const QRCode = await import("qrcode");
      
      await QRCode.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });

      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const downloadSVG = async ({ value, fileName, fgColor, bgColor, size = 400, designOptions }: DownloadOptions) => {
    let svgString: string;
    
    if (designOptions) {
      svgString = await generateStyledSVG(value, size, designOptions);
    } else {
      const QRCode = await import("qrcode");
      svgString = await QRCode.toString(value, {
        type: "svg",
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });
    }

    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = `${fileName}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadPDF = async ({ value, fileName, fgColor, bgColor, size = 400, designOptions }: DownloadOptions) => {
    let imgData: string;
    let imgWidth: number;
    let imgHeight: number;
    
    if (designOptions) {
      const svgString = await generateStyledSVG(value, size, designOptions);
      
      // Parse SVG to get dimensions
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, "image/svg+xml");
      const svgElement = doc.querySelector("svg");
      imgWidth = parseInt(svgElement?.getAttribute("width") || String(size));
      imgHeight = parseInt(svgElement?.getAttribute("height") || String(size));
      
      const canvas = await svgToCanvas(svgString, imgWidth, imgHeight);
      imgData = canvas.toDataURL("image/png");
    } else {
      const canvas = document.createElement("canvas");
      const QRCode = await import("qrcode");
      
      await QRCode.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      });

      imgData = canvas.toDataURL("image/png");
      imgWidth = size;
      imgHeight = size;
    }

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const maxQrSize = 100;
    const aspectRatio = imgWidth / imgHeight;
    const qrWidth = Math.min(maxQrSize, maxQrSize * aspectRatio);
    const qrHeight = qrWidth / aspectRatio;
    const x = (pdfWidth - qrWidth) / 2;
    const y = 40;

    pdf.setFontSize(20);
    pdf.text(fileName, pdfWidth / 2, 25, { align: "center" });
    pdf.addImage(imgData, "PNG", x, y, qrWidth, qrHeight);
    pdf.setFontSize(10);
    pdf.setTextColor(128);
    pdf.text("Generated by IEOSUIA QR", pdfWidth / 2, y + qrHeight + 15, { align: "center" });
    
    pdf.save(`${fileName}.pdf`);
  };

  const download = async (format: DownloadFormat, options: DownloadOptions) => {
    switch (format) {
      case "png":
        await downloadPNG(options);
        break;
      case "svg":
        await downloadSVG(options);
        break;
      case "pdf":
        await downloadPDF(options);
        break;
    }
  };

  return { download, downloadPNG, downloadSVG, downloadPDF };
}
