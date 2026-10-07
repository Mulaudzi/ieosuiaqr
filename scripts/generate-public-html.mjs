import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const indexPath = resolve(dist, "index.html");
const baseHtml = await readFile(indexPath, "utf8");

const baseRoutes = [
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

const seoRoutes = [
  ["features", "QR Code Features | IEOSUIA QR", "Explore current IEOSUIA QR features for dynamic destinations, scan analytics, inventory linking and supported brand customisation.", "QR code tools for creating, updating and tracking", "IEOSUIA QR brings the current QR workflow into one workspace without presenting roadmap ideas as released features.", [["Dynamic QR codes", "Update supported destinations without replacing a QR code already in circulation."], ["Scan analytics", "Review supported scan totals, unique scans, trends, devices, approximate locations and recent activity."], ["Inventory and branding", "Associate QR codes with inventory records and apply supported colours, patterns, frames and logos."]]],
  ["dynamic-qr-codes", "Dynamic QR Codes | Update QR Destinations | IEOSUIA QR", "Create dynamic QR codes and update supported destinations without replacing the printed code using IEOSUIA QR.", "Update a supported QR destination after printing", "A dynamic QR code keeps the scannable code consistent while its supported destination can be managed from your IEOSUIA QR workspace.", [["Create once", "Choose a supported QR workflow, configure its destination or content, and download the generated code."], ["Manage the destination", "When supported, change its destination from the authenticated workspace instead of reprinting the code."], ["Review activity", "Use QR analytics to review supported scan activity for the code."]]],
  ["qr-code-generator-south-africa", "QR Code Generator South Africa | IEOSUIA QR", "Create and manage smart QR codes for South African businesses, schools, churches, events and organisations with IEOSUIA QR.", "A QR code generator for South African organisations", "Create supported QR types, apply available branding, manage destinations and review scan activity from a focused web workspace.", [["Create", "Generate QR codes for supported URLs, contact details, WiFi, events, locations and other available workflows."], ["Use", "Connect people to current information or associate a code with an inventory record where supported."], ["Protect", "Private QR, analytics and inventory data remains protected by authentication and authorization."]]],
  ["branded-qr-codes", "Branded QR Codes | Colours, Frames and Logos | IEOSUIA QR", "Create branded QR codes with supported colours, patterns, frames and logo placement using IEOSUIA QR.", "Create QR codes that fit your visual identity", "Apply supported design controls, then test the finished code before distributing or printing it.", [["Colours and patterns", "Choose supported colours and QR patterns."], ["Frames and logos", "Apply supported frames and logo placement."], ["Test before use", "Maintain contrast and test the finished QR code across devices before publication."]]],
  ["qr-analytics", "QR Analytics and Scan Tracking | IEOSUIA QR", "Review supported QR scan totals, unique scans, trends, devices, approximate locations and recent scan activity in IEOSUIA QR.", "Understand supported QR scan activity", "IEOSUIA QR provides an authenticated analytics workspace for reviewing how managed codes are scanned.", [["Activity overview", "Review supported scan totals, unique scans and activity trends."], ["Available context", "Where available, reporting includes device information, approximate location information and recent activity."], ["Private reporting", "User analytics and scan history remain behind account authorization and outside the public sitemap."]]],
  ["inventory-qr-codes", "Inventory and Asset QR Codes | IEOSUIA QR", "Link QR codes to inventory records for supported item identification, movement history, stock counts and controlled workflows.", "Connect QR codes to inventory records", "Use inventory-linked QR codes for products, equipment and assets when a physical record needs identification and controlled history.", [["Identify", "Associate a QR code with a supported inventory item and location."], ["Record", "Use supported stock, checkout, return, transfer, maintenance and reconciliation workflows."], ["Audit", "Movement and stock-count history remains available only to authorised users."]]],
  ["use-cases", "Business QR Code Use Cases | IEOSUIA QR", "Practical QR code uses for products, menus, events, schools, churches, equipment, assets and business information.", "Useful QR code workflows for everyday organisations", "Practical examples using current QR creation, destination management, scan reporting and inventory linking without invented integrations.", [["Retail and restaurants", "Connect packaging, displays or table signage to current product information, menus or contact details."], ["Events, schools and churches", "Share schedules, locations, resources or contact details."], ["Equipment and assets", "Identify supported inventory records and maintain controlled history."]]],
  ["pricing", "IEOSUIA QR Pricing | Start Free", "Start using IEOSUIA QR free and review current account access and product information without a permanent free-forever promise.", "Start with IEOSUIA QR for free", "Create an account to use currently available QR tools. This page does not make a permanent unlimited or free-forever commitment.", [["Start free", "Create an account through IEOSUIA Central Auth."], ["Current terms apply", "Applicable limits or future commercial terms will be communicated accurately."], ["Organisational use", "Contact IEOSUIA to discuss a specific implementation question."]]],
  ["faq", "QR Code FAQ | IEOSUIA QR", "Answers about dynamic QR codes, scan tracking, destination updates, inventory links, brand customisation and IEOSUIA QR access.", "Answers about IEOSUIA QR Codes", "Clear answers based on currently supported product behaviour.", [["What is a dynamic QR code?", "A supported dynamic QR code uses a managed destination that can be updated without replacing the printed code."], ["Can I track QR code scans?", "The authenticated analytics workspace reports supported scan activity."], ["Can I link QR codes to inventory and apply branding?", "Supported inventory records can be linked and available design controls can be applied."]]],
  ["popia-compliance", "POPIA and Privacy Information | IEOSUIA QR", "Understand IEOSUIA QR privacy practices and POPIA-aware handling of account, QR and scan-related information.", "POPIA-aware information handling", "Privacy principles applied to IEOSUIA QR without presenting a legal certification or unconditional compliance guarantee.", [["Purpose", "Information is processed to provide supported account, QR, analytics and inventory functionality."], ["Access", "Private areas are protected by authentication and authorization."], ["Public boundary", "Private QR records, destinations, scan history, analytics and inventory records are not public SEO content."]]],
].map(([path, title, description, heading, intro, sections]) => ({ path, title, description, heading, intro, sections }));

const solutionRoutes = [
  ["inventory-asset-tracking", "Inventory and Asset Tracking", "Link QR codes to equipment, products and assets with controlled inventory workflows."],
  ["retail-ecommerce", "QR Codes for Retail", "Connect products and displays to current information and understand supported scan activity."],
  ["restaurants-cafes", "QR Codes for Restaurants", "Share menus, locations, booking details and feedback links through managed QR codes."],
  ["events-entertainment", "QR Codes for Events", "Share event schedules, locations, contacts and supported event content from one managed code."],
  ["education", "QR Codes for Education", "Connect learners, staff and visitors to resources, locations and managed assets."],
  ["churches-religious", "QR Codes for Churches", "Share programmes and resources while linking equipment and assets to controlled records."],
  ["hospitality-tourism", "QR Codes for Hospitality", "Give guests quick access to useful information, locations, WiFi details and feedback links."],
  ["professional-services", "QR Codes for Professional Services", "Share contact details, portfolios, documents and current client resources."],
].map(([slug, heading, description]) => ({
  path: `solutions/${slug}`,
  title: `${heading} | IEOSUIA QR`,
  description,
  heading,
  intro: description,
  sections: [
    ["Create", "Choose a supported QR type and configure the information or destination it represents."],
    ["Manage", "Update supported destinations and keep QR records organised in one workspace."],
    ["Understand", "Review supported scan activity and connect physical records where the workflow requires it."],
  ],
}));

const routes = [...baseRoutes, ...seoRoutes, ...solutionRoutes];

const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function staticBody(route) {
  const cards = route.sections.map(([heading, copy]) => `<section class="crawler-shell__card"><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(copy)}</p></section>`).join("");
  const badge = route.badge ? `<p><strong>${escapeHtml(route.badge)}</strong></p>` : "";
  return `<div class="crawler-shell"><header class="crawler-shell__bar"><nav class="crawler-shell__nav" aria-label="Main navigation"><a href="/" aria-label="IEOSUIA QR Codes home"><img src="/ieosuia-qr-logo-standard.png" alt="IEOSUIA QR Codes" width="2172" height="724" /></a><div class="crawler-shell__links"><a href="/features">Features</a><a href="/solutions">Solutions</a><a href="/pricing">Pricing</a><a href="/docs">Docs</a><a href="/contact">Contact</a><a href="/login">Sign in</a></div></nav></header><main><nav class="crawler-shell__section" aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <span aria-current="page">${escapeHtml(route.heading)}</span></nav><section class="crawler-shell__hero">${badge}<h1>${escapeHtml(route.heading)}</h1><p class="crawler-shell__lead">${escapeHtml(route.intro)}</p></section><div class="crawler-shell__section crawler-shell__grid">${cards}</div><section class="crawler-shell__section crawler-shell__cta"><h2>Ready to create a managed QR code?</h2><p>Start free or read the documentation before creating your first code.</p><a class="crawler-shell__button" href="/register">Create a QR Code Free</a></section></main><footer class="crawler-shell__footer"><strong>IEOSUIA QR Codes</strong><span><a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a> &middot; <a href="/cookies">Cookies</a> &middot; <a href="/support">Support</a></span><span><a href="https://www.instagram.com/ieosuia_official/" target="_blank" rel="noopener noreferrer" aria-label="IEOSUIA on Instagram">Instagram</a> &middot; <a href="https://www.facebook.com/ieosuia/" target="_blank" rel="noopener noreferrer" aria-label="IEOSUIA on Facebook">Facebook</a> &middot; <a href="https://www.tiktok.com/@ieosuia" target="_blank" rel="noopener noreferrer" aria-label="IEOSUIA on TikTok">TikTok</a></span></footer></div>`;
}

function renderRoute(route) {
  const canonical = `https://qr.ieosuia.com/${route.path}`;
  const structuredGraph = [
    { "@type": "WebPage", name: route.heading, url: canonical, description: route.description, isPartOf: { "@type": "WebSite", name: "IEOSUIA QR Codes", url: "https://qr.ieosuia.com/" } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://qr.ieosuia.com/" }, { "@type": "ListItem", position: 2, name: route.heading, item: canonical }] },
  ];
  if (route.path === "faq") structuredGraph.push({ "@type": "FAQPage", mainEntity: route.sections.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) });
  let html = baseHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(route.description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(route.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(route.description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`)
    .replace(/<script id="structured-data" type="application\/ld\+json">[\s\S]*?<\/script>/, `<script id="structured-data" type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": structuredGraph })}</script>`)
    .replace(/<!-- public-static-content:start -->[\s\S]*?<!-- public-static-content:end -->/, `<!-- public-static-content:start -->${staticBody(route)}<!-- public-static-content:end -->`);
  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (h1Count !== 1 || html.includes('<div id="root"></div>')) throw new Error(`Invalid static HTML for /${route.path}: h1=${h1Count}`);
  return html;
}

for (const route of routes) await writeFile(resolve(dist, `${route.path.replaceAll("/", "-")}.html`), renderRoute(route), "utf8");

const rootH1Count = (baseHtml.match(/<h1(?:\s|>)/g) ?? []).length;
if (rootH1Count !== 1 || baseHtml.includes('<div id="root"></div>')) throw new Error(`Invalid static HTML for /: h1=${rootH1Count}`);
for (const requiredText of ["IEOSUIA QR Codes", "Smart QR Codes. Create. Update. Track.", "Available Now", "Coming Soon", "Create a QR Code Free"]) {
  if (!baseHtml.includes(requiredText)) throw new Error(`Missing required homepage content: ${requiredText}`);
}
if (/free forever|lovable/i.test(baseHtml)) throw new Error("Forbidden public branding or pricing language found in homepage HTML");
console.log(`Generated crawler-readable HTML for / and ${routes.map(route => `/${route.path}`).join(", ")}`);
