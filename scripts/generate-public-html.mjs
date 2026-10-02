import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const indexPath = resolve(dist, "index.html");
const baseHtml = await readFile(indexPath, "utf8");

const routes = [
  {
    path: "solutions",
    title: "QR Code Solutions | IEOSUIA QR",
    description: "Explore practical IEOSUIA QR solutions for inventory, retail, hospitality, events, education, healthcare, and business operations.",
    heading: "QR Code Solutions",
    intro: "Use IEOSUIA QR to connect physical items and places with useful digital information, supported workflows, and measurable scan activity.",
    sections: [
      ["Inventory and asset tracking", "Link QR codes to products, equipment, books, supplies, and other managed assets."],
      ["Customer experiences", "Share supported product pages, menus, contact details, event information, and digital resources."],
      ["Operational visibility", "Review QR activity and manage supported destinations from one workspace."],
    ],
  },
  {
    path: "docs",
    title: "Documentation | IEOSUIA QR",
    description: "Learn how to create, customise, manage, download, and track QR codes and linked inventory in IEOSUIA QR.",
    heading: "IEOSUIA QR Documentation",
    intro: "Find guidance for QR code creation, supported QR types, design customisation, scan analytics, inventory linking, and account settings.",
    sections: [
      ["Getting started", "Create your first QR code and understand the IEOSUIA QR dashboard."],
      ["QR code management", "Edit supported destinations, apply branding, and download QR codes."],
      ["Inventory and analytics", "Link inventory records and understand scan and movement reporting."],
    ],
  },
  {
    path: "privacy",
    title: "Privacy Policy | IEOSUIA QR",
    description: "Read how IEOSUIA QR collects, uses, protects, and manages personal information and scan-related data under applicable privacy law.",
    heading: "Privacy Policy",
    intro: "IEOSUIA QR is committed to protecting personal information and explaining how information is handled when the QR platform is used.",
    sections: [
      ["POPIA compliance", "IEOSUIA applies South African privacy principles including accountability, purpose limitation, openness, and security safeguards."],
      ["Information we process", "This can include account details, service preferences, device information, and QR scan information needed to provide the service."],
      ["Your choices", "You may contact IEOSUIA about access, correction, deletion, or other privacy questions."],
    ],
  },
  {
    path: "terms",
    title: "Terms of Service | IEOSUIA QR",
    description: "Review the terms governing access to and use of the IEOSUIA QR code creation, management, analytics, and inventory platform.",
    heading: "Terms of Service",
    intro: "These terms explain the conditions for using IEOSUIA QR and the responsibilities that apply to account holders and visitors.",
    sections: [
      ["Service description", "IEOSUIA QR provides supported QR creation, management, analytics, customisation, and inventory tools."],
      ["Account responsibilities", "Users must provide accurate information, protect account access, and use the service lawfully."],
      ["Acceptable use", "The platform may not be used for unlawful, fraudulent, harmful, or unauthorised activity."],
    ],
  },
  {
    path: "cookies",
    title: "Cookie Policy | IEOSUIA QR",
    description: "Learn which cookies and local browser storage IEOSUIA QR uses for account access, preferences, security, and service operation.",
    heading: "Cookie Policy",
    intro: "This policy explains how IEOSUIA QR uses browser storage and cookies to provide secure account access and remember service preferences.",
    sections: [
      ["Essential storage", "Required storage supports authentication, security, and core application operation."],
      ["Functional storage", "Preference storage can remember selected settings and improve the user experience."],
      ["Your choices", "Cookie controls are available through the site and your browser settings."],
    ],
  },
  {
    path: "support",
    title: "Support and FAQ | IEOSUIA QR",
    description: "Get help with IEOSUIA QR creation, customisation, analytics, inventory, account access, and common questions.",
    heading: "IEOSUIA QR Support",
    intro: "Find answers to common questions or contact IEOSUIA for help with the QR platform.",
    sections: [
      ["QR code help", "Get help creating, customising, downloading, and managing supported QR codes."],
      ["Inventory and analytics", "Learn how linked inventory and scan reporting work."],
      ["Account and security", "Find guidance for Central Auth access, settings, and security questions."],
    ],
  },
  {
    path: "contact",
    title: "Contact IEOSUIA QR",
    description: "Contact IEOSUIA for QR platform support, general questions, implementation discussions, or partnership enquiries.",
    heading: "Contact IEOSUIA QR",
    intro: "Choose the appropriate contact option for product questions, technical support, implementation discussions, or partnerships.",
    sections: [
      ["General enquiries", "Ask a general question about IEOSUIA QR and its supported capabilities."],
      ["Technical support", "Get help with account access or a problem using the QR platform."],
      ["Implementation and partnerships", "Discuss organisational use, implementation requirements, or partnership opportunities."],
    ],
  },
  {
    path: "careers",
    title: "Careers | IEOSUIA QR",
    description: "Learn about future career opportunities with IEOSUIA and the team building IEOSUIA QR Codes.",
    heading: "Join Our Team",
    intro: "IEOSUIA is building practical QR code technology and connected digital tools.",
    badge: "Coming Soon",
    sections: [
      ["Future opportunities", "There are currently no open IEOSUIA QR positions published on this page."],
      ["How opportunities will be shared", "Confirmed roles and application details will be published here when available."],
    ],
  },
];

const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function staticBody(route) {
  const cards = route.sections.map(([heading, copy]) => `<section class="crawler-shell__card"><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(copy)}</p></section>`).join("");
  const badge = route.badge ? `<p><strong>${escapeHtml(route.badge)}</strong></p>` : "";
  return `<div class="crawler-shell"><header class="crawler-shell__bar"><nav class="crawler-shell__nav" aria-label="Main navigation"><a href="/" aria-label="IEOSUIA QR Codes home"><img src="/ieosuia-qr-logo-standard.png" alt="IEOSUIA QR Codes" width="2172" height="724" /></a><div class="crawler-shell__links"><a href="/#features">Features</a><a href="/solutions">Solutions</a><a href="/docs">Docs</a><a href="/login">Sign in</a></div></nav></header><main><section class="crawler-shell__hero">${badge}<h1>${escapeHtml(route.heading)}</h1><p class="crawler-shell__lead">${escapeHtml(route.intro)}</p></section><div class="crawler-shell__section crawler-shell__grid">${cards}</div><section class="crawler-shell__section crawler-shell__cta"><h2>Need more help?</h2><p>Contact IEOSUIA or open the full interactive page for more information.</p><a class="crawler-shell__button" href="/contact">Contact IEOSUIA</a></section></main><footer class="crawler-shell__footer"><strong>IEOSUIA QR Codes</strong><span><a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a> &middot; <a href="/cookies">Cookies</a> &middot; <a href="/support">Support</a></span></footer></div>`;
}

function renderRoute(route) {
  const canonical = `https://qr.ieosuia.com/${route.path}`;
  let html = baseHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(route.description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(route.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(route.description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`)
    .replace(/<!-- public-static-content:start -->[\s\S]*?<!-- public-static-content:end -->/, `<!-- public-static-content:start -->${staticBody(route)}<!-- public-static-content:end -->`);
  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (h1Count !== 1 || html.includes('<div id="root"></div>')) throw new Error(`Invalid static HTML for /${route.path}: h1=${h1Count}`);
  return html;
}

for (const route of routes) await writeFile(resolve(dist, `${route.path}.html`), renderRoute(route), "utf8");

const rootH1Count = (baseHtml.match(/<h1(?:\s|>)/g) ?? []).length;
if (rootH1Count !== 1 || baseHtml.includes('<div id="root"></div>')) throw new Error(`Invalid static HTML for /: h1=${rootH1Count}`);
for (const requiredText of ["IEOSUIA QR Codes", "Smart QR Codes. Create. Update. Track.", "Available Now", "Coming Soon", "Create a QR Code Free"]) {
  if (!baseHtml.includes(requiredText)) throw new Error(`Missing required homepage content: ${requiredText}`);
}
if (/free forever|lovable/i.test(baseHtml)) throw new Error("Forbidden public branding or pricing language found in homepage HTML");
console.log(`Generated crawler-readable HTML for / and ${routes.map(route => `/${route.path}`).join(", ")}`);
