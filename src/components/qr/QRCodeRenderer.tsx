import { useMemo, useId } from "react";
import QRCodeGenerator from "qrcode";
import { QRDesignOptions } from "./QRDesignCustomizer";

interface QRCodeRendererProps {
  value: string;
  size: number;
  options: QRDesignOptions;
}

type DotRenderer = (
  ctx: { x: number; y: number; size: number; color: string },
  moduleSize: number
) => React.ReactNode;

// Different dot rendering strategies
const dotRenderers: Record<QRDesignOptions["shapeStyle"], DotRenderer> = {
  squares: ({ x, y, size, color }) => (
    <rect x={x} y={y} width={size} height={size} fill={color} />
  ),
  
  dots: ({ x, y, size, color }) => (
    <circle cx={x + size / 2} cy={y + size / 2} r={size / 2} fill={color} />
  ),
  
  rounded: ({ x, y, size, color }) => (
    <rect x={x} y={y} width={size} height={size} rx={size * 0.3} ry={size * 0.3} fill={color} />
  ),
  
  classy: ({ x, y, size, color }) => (
    <rect x={x} y={y} width={size} height={size} rx={size * 0.15} ry={size * 0.15} fill={color} />
  ),
  
  "classy-rounded": ({ x, y, size, color }) => (
    <rect x={x} y={y} width={size} height={size} rx={size * 0.4} ry={size * 0.4} fill={color} />
  ),
  
  "extra-rounded": ({ x, y, size, color }) => (
    <circle cx={x + size / 2} cy={y + size / 2} r={size * 0.45} fill={color} />
  ),
  
  fluid: ({ x, y, size, color }) => (
    <ellipse cx={x + size / 2} cy={y + size / 2} rx={size * 0.5} ry={size * 0.4} fill={color} />
  ),
  
  "edge-cut": ({ x, y, size, color }) => (
    <polygon 
      points={`${x + size * 0.2},${y} ${x + size * 0.8},${y} ${x + size},${y + size * 0.2} ${x + size},${y + size * 0.8} ${x + size * 0.8},${y + size} ${x + size * 0.2},${y + size} ${x},${y + size * 0.8} ${x},${y + size * 0.2}`}
      fill={color}
    />
  ),
};

// Finder pattern (corner squares) renderer based on corner style
const renderFinderPattern = (
  x: number,
  y: number,
  size: number,
  outerColor: string,
  innerColor: string,
  bgColor: string,
  cornerStyle: QRDesignOptions["cornerStyle"]
): React.ReactNode => {
  const outerSize = size;
  const middleSize = size * 0.714;
  const innerSize = size * 0.428;
  const middleOffset = (outerSize - middleSize) / 2;
  const innerOffset = (outerSize - innerSize) / 2;
  
  const getRadius = (baseSize: number) => {
    switch (cornerStyle) {
      case "square":
      case "classy":
        return 0;
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
  
  const outerRadius = getRadius(outerSize);
  const middleRadius = getRadius(middleSize);
  const innerRadius = cornerStyle === "dot" || cornerStyle === "rounded-dot" 
    ? innerSize * 0.5 
    : getRadius(innerSize);
  
  return (
    <g key={`finder-${x}-${y}`}>
      {/* Outer square */}
      <rect 
        x={x} 
        y={y} 
        width={outerSize} 
        height={outerSize} 
        rx={outerRadius} 
        ry={outerRadius} 
        fill={outerColor} 
      />
      {/* Middle (background) square */}
      <rect 
        x={x + middleOffset} 
        y={y + middleOffset} 
        width={middleSize} 
        height={middleSize} 
        rx={middleRadius} 
        ry={middleRadius} 
        fill={bgColor} 
      />
      {/* Inner square/dot */}
      {cornerStyle === "dot" || cornerStyle === "rounded-dot" ? (
        <circle 
          cx={x + outerSize / 2} 
          cy={y + outerSize / 2} 
          r={innerSize / 2} 
          fill={innerColor} 
        />
      ) : (
        <rect 
          x={x + innerOffset} 
          y={y + innerOffset} 
          width={innerSize} 
          height={innerSize} 
          rx={innerRadius} 
          ry={innerRadius} 
          fill={innerColor} 
        />
      )}
    </g>
  );
};

export function QRCodeRenderer({ value, size, options }: QRCodeRendererProps) {
  const gradientId = useId();
  
  const {
    shapeStyle,
    bgColor,
    fgColor,
    transparentBg,
    gradient,
    gradientColor,
    cornerStyle,
    cornerColor,
  } = options;

  const effectiveBgColor = transparentBg ? "transparent" : bgColor;
  const effectiveCornerColor = cornerColor || fgColor;

  // Generate QR code matrix
  const qrMatrix = useMemo(() => {
    try {
      const qr = QRCodeGenerator.create(value || "https://example.com", {
        errorCorrectionLevel: "H",
      });
      return qr.modules;
    } catch {
      return null;
    }
  }, [value]);

  if (!qrMatrix) {
    return (
      <svg width={size} height={size}>
        <rect width={size} height={size} fill={effectiveBgColor} />
        <text x={size / 2} y={size / 2} textAnchor="middle" fill={fgColor} fontSize={12}>
          Invalid QR Data
        </text>
      </svg>
    );
  }

  const moduleCount = qrMatrix.size;
  const margin = 4; // QR code margin in modules
  const totalModules = moduleCount + margin * 2;
  const moduleSize = size / totalModules;
  const offset = margin * moduleSize;

  // Finder pattern locations (top-left, top-right, bottom-left)
  const finderPatternSize = 7;
  const finderLocations = [
    { x: 0, y: 0 },
    { x: moduleCount - finderPatternSize, y: 0 },
    { x: 0, y: moduleCount - finderPatternSize },
  ];

  // Check if a module is part of a finder pattern
  const isFinderPattern = (row: number, col: number) => {
    return finderLocations.some(
      (loc) =>
        col >= loc.x &&
        col < loc.x + finderPatternSize &&
        row >= loc.y &&
        row < loc.y + finderPatternSize
    );
  };

  const dotRenderer = dotRenderers[shapeStyle] || dotRenderers.squares;

  // Build the data modules
  const dataModules: React.ReactNode[] = [];
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qrMatrix.get(row, col) && !isFinderPattern(row, col)) {
        const x = offset + col * moduleSize;
        const y = offset + row * moduleSize;
        const color = gradient ? `url(#${gradientId})` : fgColor;
        
        dataModules.push(
          <g key={`${row}-${col}`}>
            {dotRenderer({ x, y, size: moduleSize, color }, moduleSize)}
          </g>
        );
      }
    }
  }

  // Build finder patterns
  const finderPatterns = finderLocations.map((loc) => {
    const x = offset + loc.x * moduleSize;
    const y = offset + loc.y * moduleSize;
    const patternSize = finderPatternSize * moduleSize;
    
    return renderFinderPattern(
      x,
      y,
      patternSize,
      effectiveCornerColor,
      effectiveCornerColor,
      effectiveBgColor === "transparent" ? "#FFFFFF" : effectiveBgColor,
      cornerStyle
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background */}
      {effectiveBgColor !== "transparent" && (
        <rect width={size} height={size} fill={effectiveBgColor} />
      )}
      
      {/* Gradient definition */}
      {gradient && gradientColor && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={fgColor} />
            <stop offset="100%" stopColor={gradientColor} />
          </linearGradient>
        </defs>
      )}
      
      {/* Data modules */}
      {dataModules}
      
      {/* Finder patterns */}
      {finderPatterns}
    </svg>
  );
}
