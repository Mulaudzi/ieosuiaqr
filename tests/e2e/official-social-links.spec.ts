import { expect, test } from "@playwright/test";

const approvedLinks = [
  ["IEOSUIA on Instagram", "https://www.instagram.com/ieosuia_official/"],
  ["IEOSUIA on Facebook", "https://www.facebook.com/ieosuia/"],
  ["IEOSUIA on TikTok", "https://www.tiktok.com/@ieosuia"],
] as const;

test("footer exposes only approved official IEOSUIA social profiles", async ({ page }) => {
  await page.goto("/");
  const group = page.getByLabel("Official IEOSUIA social media");
  await expect(group.getByRole("link")).toHaveCount(approvedLinks.length);

  for (const [label, href] of approvedLinks) {
    const link = group.getByRole("link", { name: label });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }

  await expect(group).not.toContainText(/YouTube|LinkedIn|Twitter|WhatsApp|Discord|Telegram/i);
});
