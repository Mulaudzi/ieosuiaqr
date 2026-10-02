import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "wide", width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  test(`premium landing page is viewport-safe at ${viewport.name}`, async ({ page }, testInfo) => {
    await page.route("**/api/auth/me", route => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ success: false }) }));
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Smart QR Codes/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Everything your QR code needs/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /See what happens after the scan/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Ready to make your QR codes work harder/i })).toBeVisible();
    await expect(page.getByAltText("IEOSUIA QR Codes")).toHaveCount(2);
    const layout = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    expect(layout.document).toBeLessThanOrEqual(layout.viewport + 1);
    expect(layout.body).toBeLessThanOrEqual(layout.viewport + 1);
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < pageHeight; y += Math.max(300, Math.floor(viewport.height * 0.7))) {
      await page.evaluate(scrollY => window.scrollTo({ top: scrollY, behavior: "instant" }), y);
      await page.waitForTimeout(40);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await testInfo.attach(viewport.name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });
}

test("landing calls to action and navigation retain their destinations", async ({ page }) => {
  await page.route("**/api/auth/me", route => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ success: false }) }));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Start Free", exact: true }).first()).toHaveAttribute("href", "/signup");
  await expect(page.getByRole("link", { name: "See How It Works" })).toHaveAttribute("href", "#how-it-works");
  await expect(page.getByRole("link", { name: "Docs", exact: true })).toHaveAttribute("href", "/docs");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Pricing", exact: true })).toHaveAttribute("href", "/#pricing");
  await expect(page.getByRole("link", { name: /Create Your First QR Code/i })).toHaveAttribute("href", "/signup");
});

test("mobile navigation remains keyboard accessible", async ({ page }) => {
  await page.route("**/api/auth/me", route => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ success: false }) }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open navigation menu" });
  await menu.focus();
  await expect(menu).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Close navigation menu" })).toBeVisible();
  await expect(page.locator("#mobile-navigation").getByRole("link", { name: "Pricing", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeVisible();
});
