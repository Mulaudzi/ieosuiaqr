import { expect, test, type Page } from "@playwright/test";

const logo = (page: Page) => page.getByAltText("IEOSUIA QR Codes");

async function expectLogoGeometry(page: Page) {
  await expect(page.locator('img[alt="IEOSUIA QR Codes"]:visible').first()).toBeVisible();
  await page.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>('img[alt="IEOSUIA QR Codes"]')].filter(image => getComputedStyle(image).display !== "none").every(image => image.complete && image.naturalWidth > 0));
  const measurements = await logo(page).evaluateAll((images: HTMLImageElement[]) => images.filter(image => {
    const style = getComputedStyle(image);
    return style.display !== "none" && image.getBoundingClientRect().width > 0;
  }).map(image => {
    const box = image.getBoundingClientRect();
    return { naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, width: box.width, height: box.height };
  }));
  expect(measurements.length).toBeGreaterThan(0);
  for (const image of measurements) {
    expect(image.naturalWidth).toBe(2172);
    expect(image.naturalHeight).toBe(724);
    expect(image.width / image.height).toBeCloseTo(3, 1);
  }
}

test("public header and footer use their explicit light-surface variants", async ({ page }) => {
  await page.route("**/api/auth/me", route => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ success: false }) }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(logo(page)).toHaveCount(2);
  await expect(logo(page).nth(0)).toHaveAttribute("src", /IEOSUIA%20QR%20Standard/);
  await expect(logo(page).nth(1)).toHaveAttribute("src", /IEOSUIA%20QR%20Footer/);
  await expectLogoGeometry(page);
});

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  test(`brand logos remain proportional and viewport-safe on ${viewport.name}`, async ({ page }, testInfo) => {
    await page.route("**/api/auth/me", route => route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ success: false }) }));
    await page.setViewportSize(viewport);
    for (const route of ["/", "/forgot-password", "/reset-password?token=test"]) {
      await page.goto(route);
      await expectLogoGeometry(page);
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(viewport.width + 1);
      await testInfo.attach(`${viewport.name}-${route.replaceAll(/[/?=]/g, "-")}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
    }
  });
}

test("scan card uses the high-contrast logo", async ({ page }) => {
  await page.route("**/api/scan/log**", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, data: { redirect_url: null, type: "text", content: "Logo acceptance" } }),
  }));
  await page.goto("/go/logo-acceptance");
  await expect(logo(page)).toHaveAttribute("src", /IEOSUIA%20QR%20High%20Contrast/);
  await expectLogoGeometry(page);
});
