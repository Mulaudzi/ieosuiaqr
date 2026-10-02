import darkLogo from "@/assets/IEOSUIA QR Dark.png";
import footerLogo from "@/assets/IEOSUIA QR Footer.png";
import highContrastLogo from "@/assets/IEOSUIA QR High Contrast.png";
import standardLogo from "@/assets/IEOSUIA QR Standard.png";

export type IEOSUIAQrLogoVariant = "standard" | "footer" | "dark" | "high-contrast";

const logoSources: Record<IEOSUIAQrLogoVariant, string> = {
  standard: standardLogo,
  footer: footerLogo,
  dark: darkLogo,
  "high-contrast": highContrastLogo,
};

export function getIEOSUIAQrLogoSource(variant: IEOSUIAQrLogoVariant): string {
  return logoSources[variant];
}
