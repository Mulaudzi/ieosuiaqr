import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("public crawler HTML", () => {
  const html = readProjectFile("index.html");

  it("exposes meaningful homepage content before JavaScript runs", () => {
    expect(html).toContain("<h1>Smart QR Codes. Create. Update. Track.</h1>");
    expect(html).toContain("IEOSUIA QR Codes");
    expect(html).toContain("Create, manage, update and track QR codes");
    expect(html).toContain("Available Now");
    expect(html).toContain("Coming Soon");
    expect(html).toContain("Dynamic QR Codes");
    expect(html).toContain("Scan Analytics");
    expect(html).toContain("Create a QR Code Free");
    expect(html).not.toMatch(/<div id="root"><\/div>/);
  });

  it("publishes complete production metadata and branded icons", () => {
    expect(html).toContain("<title>IEOSUIA QR | Smart QR Codes for Business</title>");
    expect(html).toContain('<link rel="canonical" href="https://qr.ieosuia.com/"');
    expect(html).toContain('<meta property="og:url" content="https://qr.ieosuia.com/"');
    expect(html).toContain('<meta name="twitter:title"');
    expect(html).toContain('<meta name="theme-color"');
    expect(html).toContain("/ieosuia-qr-favicon-v2.png");
    expect(html.toLowerCase()).not.toContain("lovable");
    expect(html).not.toMatch(/free forever/i);
  });

  it("keeps private application routes out of the sitemap", () => {
    const robots = readProjectFile("public/robots.txt");
    const sitemap = readProjectFile("public/sitemap.xml");
    expect(robots).toContain("Disallow: /dashboard/");
    expect(robots).toContain("Sitemap: https://qr.ieosuia.com/sitemap.xml");
    expect(sitemap).toContain("https://qr.ieosuia.com/solutions");
    expect(sitemap).not.toMatch(/dashboard|admin|api|scan|\/go\//i);
  });

  it("generates route-specific crawler HTML for every canonical public page", () => {
    const generator = readProjectFile("scripts/generate-public-html.mjs");
    const rewrites = readProjectFile("public/.htaccess");
    const publicRoutes = ["solutions", "docs", "privacy", "terms", "cookies", "support", "contact", "careers"];

    for (const route of publicRoutes) {
      expect(generator).toContain(`path: "${route}"`);
      expect(rewrites).toContain(route);
    }
    expect(generator).toContain("<h1>${escapeHtml(route.heading)}</h1>");
    expect(generator).toContain("Invalid static HTML for /");
  });

  it("keeps public source free of private records and prohibited public wording", () => {
    const generator = readProjectFile("scripts/generate-public-html.mjs");
    const manifest = readProjectFile("public/site.webmanifest");
    const publicArtifacts = `${html}\n${manifest}`;
    expect(publicArtifacts).not.toMatch(/free forever/i);
    expect(publicArtifacts).not.toMatch(/lovable(?:\.dev|\.app)?/i);
    expect(generator).not.toMatch(/scan_logs|inventory_movements|customer_email|user_id/i);
  });
});
