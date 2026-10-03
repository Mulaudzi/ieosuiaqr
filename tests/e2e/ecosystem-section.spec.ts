import { expect, test } from "@playwright/test";

for (const width of [360, 390, 430, 768, 1440, 1920]) {
  test(`ecosystem showcase is usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
    await page.goto("/");
    const section = page.getByRole("region", { name: "More tools. More services. One IEOSUIA ecosystem." });
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    await expect(section.getByText("Current product", { exact: true })).toBeVisible();
    await expect(section.getByRole("link", { name: "Explore IEOSUIA Invoices" })).toHaveAttribute("href", "https://invoices.ieosuia.com/");
    await expect(section.getByRole("link", { name: "Explore IEOSUIA SMS Portal" })).toHaveAttribute("href", "https://sms.ieosuia.com/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}
