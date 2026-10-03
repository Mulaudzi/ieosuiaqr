import { expect, test } from "@playwright/test";

const routes = ["/", "/features", "/dynamic-qr-codes", "/qr-code-generator-south-africa", "/branded-qr-codes", "/qr-analytics", "/inventory-qr-codes", "/use-cases", "/pricing", "/faq", "/popia-compliance"];

for (const width of [360, 390, 430, 768, 1440, 1920]) {
  test(`public SEO pages remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  });
}

test("feature pages expose breadcrumbs, descriptive links and private-route boundaries", async ({ page }) => {
  await page.goto("/qr-analytics");
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Read the privacy policy" })).toHaveAttribute("href", "/privacy");
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/qr-analytics");
  expect(sitemap).not.toMatch(/\/dashboard|\/admin|\/scan\/|\/go\//);
});
