import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sitemap = await readFile(resolve(root, "public/sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const titles = new Set();
const descriptions = new Set();
const failures = [];

for (const url of urls) {
  const path = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  const file = path ? `${path.replaceAll("/", "-")}.html` : "index.html";
  const html = await readFile(resolve(root, "dist", file), "utf8");
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (!title || titles.has(title)) failures.push(`${file}: missing or duplicate title`); else titles.add(title);
  if (!description || descriptions.has(description)) failures.push(`${file}: missing or duplicate description`); else descriptions.add(description);
  if (canonical !== url) failures.push(`${file}: canonical ${canonical ?? "missing"} does not match ${url}`);
  if (h1Count !== 1) failures.push(`${file}: expected one H1, found ${h1Count}`);
  if (!html.includes('type="application/ld+json"')) failures.push(`${file}: structured data missing`);
  if (/<div id="root"><\/div>/.test(html)) failures.push(`${file}: empty SPA shell`);
}

for (const privatePath of ["dashboard", "admin", "scan/", "go/", "inventory/"]) {
  if (sitemap.includes(privatePath)) failures.push(`sitemap exposes private path: ${privatePath}`);
}
const social = await stat(resolve(root, "public/ieosuia-qr-social-preview-v1.png"));
if (social.size < 20_000) failures.push("social preview image is unexpectedly small");
if (failures.length) throw new Error(`SEO validation failed:\n${failures.join("\n")}`);
console.log(`SEO validation PASS: ${urls.length} canonical public pages, unique metadata, one H1, structured data, crawler HTML and private-route exclusions.`);
