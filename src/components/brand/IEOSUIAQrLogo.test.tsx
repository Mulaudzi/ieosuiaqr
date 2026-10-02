import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IEOSUIAQrLogo } from "./IEOSUIAQrLogo";
import type { IEOSUIAQrLogoVariant } from "./IEOSUIAQrLogoAssets";

describe("IEOSUIAQrLogo", () => {
  it.each<[IEOSUIAQrLogoVariant, RegExp]>([
    ["standard", /IEOSUIA%20QR%20Standard\.png$/],
    ["footer", /IEOSUIA%20QR%20Footer\.png$/],
    ["dark", /IEOSUIA%20QR%20Dark\.png$/],
    ["high-contrast", /IEOSUIA%20QR%20High%20Contrast\.png$/],
  ])("maps %s to the intended transparent asset", (variant, source) => {
    const { getByAltText, unmount } = render(<IEOSUIAQrLogo variant={variant} />);
    const image = getByAltText("IEOSUIA QR Codes");
    expect(image).toHaveAttribute("src", expect.stringMatching(source));
    expect(image).toHaveClass("h-auto", "max-w-full", "object-contain");
    unmount();
  });
});
