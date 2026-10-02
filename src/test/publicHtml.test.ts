import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("public crawler HTML", () => {
  const html = readProjectFile("index.html");

  it("exposes meaningful homepage content before JavaScript runs", () => {
    expect(html).toContain("<h1>IEOSUIA QR Codes</h1>");
    expect(html).toContain("Create, manage, update and track QR codes");
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
});
