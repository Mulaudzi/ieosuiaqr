import { expect, test } from "@playwright/test";

const longFacebookUrl = "https://www.facebook.com/61579324913045/?locale=ar_AR&utm_source=very_long_mobile_scan_link_without_spaces_abcdefghijklmnopqrstuvwxyz0123456789";

for (const width of [320, 360, 390, 430]) {
  test(`social scan result stays fixed within a ${width}px viewport`, async ({ page }) => {
    await page.route("**/api/scan/log**", route => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          redirect_url: null,
          type: "social",
          content: { links: JSON.stringify([
            { platform: "instagram", url: "https://www.instagram.com/web_evo_tech/" },
            { platform: "facebook", url: longFacebookUrl },
          ]) },
        },
      }),
    }));
    await page.setViewportSize({ width, height: 820 });
    await page.goto("/go/mobile-overflow-regression");
    await expect(page.getByRole("heading", { name: "Choose a link" })).toBeVisible();
    await expect(page.getByText(longFacebookUrl)).toBeVisible();
    const layout = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      main: document.querySelector("main")?.scrollWidth ?? 0,
    }));
    expect(layout.document).toBeLessThanOrEqual(layout.viewport);
    expect(layout.body).toBeLessThanOrEqual(layout.viewport);
    expect(layout.main).toBeLessThanOrEqual(layout.viewport);
  });
}
