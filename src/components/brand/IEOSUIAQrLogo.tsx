import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { getIEOSUIAQrLogoSource, type IEOSUIAQrLogoVariant } from "./IEOSUIAQrLogoAssets";

type IEOSUIAQrLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  variant?: IEOSUIAQrLogoVariant;
};

export function IEOSUIAQrLogo({ variant = "standard", className, decoding = "async", ...props }: IEOSUIAQrLogoProps) {
  return (
    <img
      {...props}
      src={getIEOSUIAQrLogoSource(variant)}
      alt="IEOSUIA QR Codes"
      decoding={decoding}
      className={cn("block h-auto max-w-full object-contain", className)}
    />
  );
}
