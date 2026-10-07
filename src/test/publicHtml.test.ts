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
    expect(html).toContain("Explore more from the IEOSUIA ecosystem");
    expect(html).toContain("https://invoices.ieosuia.com/");
    expect(html).toContain("https://sms.ieosuia.com/");
    expect(html).toContain("IEOSUIA QR — Current Product");
    expect(html).toContain("/dynamic-qr-codes");
    expect(html).toContain("/qr-analytics");
    expect(html).toContain("/inventory-qr-codes");
    expect(html).toContain("/branded-qr-codes");
    expect(html).toContain('"@type": "WebSite"');
    expect(html).not.toMatch(/<div id="root"><\/div>/);
  });

  it("does not expose manipulative or unsupported public claims", () => {
    expect(html).not.toMatch(/free forever|start free forever|fake review|aggregateRating/i);
  });

  it("publishes complete production metadata and branded icons", () => {
    expect(html).toContain("<title>IEOSUIA QR | Dynamic QR Codes &amp; QR Tracking South Africa</title>");
    expect(html).toContain('<link rel="canonical" href="https://qr.ieosuia.com/"');
    expect(html).toContain('<meta property="og:url" content="https://qr.ieosuia.com/"');
    expect(html).toContain('<meta name="twitter:title"');
    expect(html).toContain('<meta name="theme-color"');
    expect(html).toContain("/ieosuia-qr-favicon-v2.png");
    expect(html).toContain("/ieosuia-qr-social-preview-v1.png");
    expect(html).toContain('<meta property="og:image:width" content="1200"');
    expect(html).toContain('<meta property="og:image:height" content="630"');
    expect(html).toContain('<script id="structured-data" type="application/ld+json">');
    expect(html.toLowerCase()).not.toContain("lovable");
    expect(html).not.toMatch(/free forever/i);
  });

  it("keeps private application routes out of the sitemap", () => {
    const robots = readProjectFile("public/robots.txt");
    const sitemap = readProjectFile("public/sitemap.xml");
    expect(robots).toContain("Disallow: /dashboard/");
    expect(robots).toContain("Sitemap: https://qr.ieosuia.com/sitemap.xml");
    expect(sitemap).toContain("https://qr.ieosuia.com/solutions");
    expect(sitemap).toContain("https://qr.ieosuia.com/solutions/inventory-asset-tracking");
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

  it("ships a correctly sized social preview image", () => {
    const image = readFileSync(resolve(process.cwd(), "public/ieosuia-qr-social-preview-v1.png"));
    expect(image.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
  });

  it("keeps public source free of private records and prohibited public wording", () => {
    const generator = readProjectFile("scripts/generate-public-html.mjs");
    const manifest = readProjectFile("public/site.webmanifest");
    const publicArtifacts = `${html}\n${manifest}`;
    expect(publicArtifacts).not.toMatch(/free forever/i);
    expect(publicArtifacts).not.toMatch(/lovable(?:\.dev|\.app)?/i);
    expect(generator).not.toMatch(/scan_logs|inventory_movements|customer_email|user_id/i);
  });

  it("publishes only the approved official IEOSUIA social profiles", () => {
    const footer = readProjectFile("src/components/layout/Footer.tsx");
    const officialLinks = readProjectFile("src/components/brand/OfficialSocialLinks.tsx");
    const documentation = readProjectFile("src/pages/Documentation.tsx");
    const publicBranding = `${html}\n${footer}\n${officialLinks}\n${documentation}`;
    const approvedUrls = [
      "https://www.instagram.com/ieosuia_official/",
      "https://www.facebook.com/ieosuia/",
      "https://www.tiktok.com/@ieosuia",
    ];

    for (const url of approvedUrls) expect(publicBranding).toContain(url);
    expect(publicBranding).not.toMatch(/(?:twitter\.com|x\.com|linkedin\.com|youtube\.com|threads\.net|snapchat\.com|pinterest\.com|discord\.(?:com|gg)|t\.me)\//i);
    expect(officialLinks).toContain('rel="noopener noreferrer"');
    expect(officialLinks).not.toContain('href="#"');
    expect(html).toContain('"sameAs": [');
  });
});
