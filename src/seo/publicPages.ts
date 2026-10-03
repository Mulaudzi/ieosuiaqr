export type PublicPage = {
  path: string; title: string; description: string; eyebrow: string; heading: string; intro: string;
  sections: Array<{ title: string; body: string; links?: Array<{ label: string; href: string }> }>;
  faq?: Array<{ question: string; answer: string }>;
};

export const publicPages: PublicPage[] = [
  { path: "/features", title: "QR Code Features | IEOSUIA QR", description: "Explore current IEOSUIA QR features for dynamic destinations, scan analytics, inventory linking and supported brand customisation.", eyebrow: "Available Now", heading: "QR code tools for creating, updating and tracking", intro: "IEOSUIA QR brings the current QR workflow into one workspace without presenting roadmap ideas as released features.", sections: [
    { title: "Dynamic QR codes", body: "Create supported QR types and update supported destinations without replacing a QR code already in circulation.", links: [{ label: "Explore dynamic QR codes", href: "/dynamic-qr-codes" }] },
    { title: "Scan analytics", body: "Review supported scan totals, unique scans, trends, devices, approximate locations and recent activity.", links: [{ label: "Explore QR analytics", href: "/qr-analytics" }] },
    { title: "Inventory and branding", body: "Associate QR codes with inventory records and apply supported colours, patterns, frames and logos.", links: [{ label: "Explore inventory QR codes", href: "/inventory-qr-codes" }, { label: "Explore branded QR codes", href: "/branded-qr-codes" }] },
  ] },
  { path: "/dynamic-qr-codes", title: "Dynamic QR Codes | Update QR Destinations | IEOSUIA QR", description: "Create dynamic QR codes and update supported destinations without replacing the printed code using IEOSUIA QR.", eyebrow: "Dynamic QR codes", heading: "Update a supported QR destination after printing", intro: "A dynamic QR code keeps the scannable code consistent while its supported destination can be managed from your IEOSUIA QR workspace.", sections: [
    { title: "Create once", body: "Choose a supported QR workflow, configure its destination or content, and download the generated code." },
    { title: "Manage the destination", body: "When the QR type supports dynamic updates, change its destination from the authenticated workspace instead of reprinting the code." },
    { title: "Review activity", body: "Use the analytics workspace to review supported scan activity for the code.", links: [{ label: "Understand QR scan analytics", href: "/qr-analytics" }] },
  ], faq: [{ question: "Can I change a QR code destination after printing it?", answer: "Yes, for supported dynamic QR codes. The printed code stays the same while its managed destination is updated." }, { question: "Does every QR type support the same updates?", answer: "No. Available editing behaviour depends on the QR type and supported workflow." }] },
  { path: "/qr-code-generator-south-africa", title: "QR Code Generator South Africa | IEOSUIA QR", description: "Create and manage smart QR codes for South African businesses, schools, churches, events and organisations with IEOSUIA QR.", eyebrow: "Built for practical local use", heading: "A QR code generator for South African organisations", intro: "Create supported QR types, apply available branding, manage destinations and review scan activity from a focused web workspace.", sections: [
    { title: "Create a supported QR code", body: "Generate QR codes for supported URLs, contact details, WiFi, events, locations and other available workflows." },
    { title: "Use QR codes in real work", body: "Connect people to current information or associate a code with an inventory record where that workflow is supported.", links: [{ label: "Browse practical QR use cases", href: "/use-cases" }] },
    { title: "Privacy information", body: "Review how IEOSUIA handles account and scan-related information without making unsupported compliance guarantees.", links: [{ label: "Read POPIA information", href: "/popia-compliance" }] },
  ] },
  { path: "/branded-qr-codes", title: "Branded QR Codes | Colours, Frames and Logos | IEOSUIA QR", description: "Create branded QR codes with supported colours, patterns, frames and logo placement using IEOSUIA QR.", eyebrow: "Brand customisation", heading: "Create QR codes that fit your visual identity", intro: "Apply the supported design controls available in IEOSUIA QR, then test the finished code before distributing or printing it.", sections: [
    { title: "Supported design controls", body: "Choose available colours, patterns and frames, and add a logo where supported." },
    { title: "Keep the code usable", body: "Maintain strong contrast, avoid overcrowding the code and test it across more than one device before publication." },
    { title: "Download for use", body: "Download the finished QR code from the workspace for supported digital or print uses.", links: [{ label: "Read QR creation documentation", href: "/docs" }] },
  ] },
  { path: "/qr-analytics", title: "QR Analytics and Scan Tracking | IEOSUIA QR", description: "Review supported QR scan totals, unique scans, trends, devices, approximate locations and recent scan activity in IEOSUIA QR.", eyebrow: "QR analytics", heading: "Understand supported QR scan activity", intro: "IEOSUIA QR provides an authenticated analytics workspace for reviewing how managed codes are scanned.", sections: [
    { title: "Activity overview", body: "Review supported scan totals, unique scans and activity trends for managed QR codes." },
    { title: "Context available", body: "Where available, reporting can include device information, approximate location information and recent activity. It is not presented as conversion attribution." },
    { title: "Private by design", body: "User analytics and scan history remain behind account authorization and are excluded from the public sitemap.", links: [{ label: "Read the privacy policy", href: "/privacy" }] },
  ], faq: [{ question: "Can I track QR code scans?", answer: "Yes. Authenticated users can review the supported scan activity available for their managed QR codes." }, { question: "Does IEOSUIA QR report conversions?", answer: "No conversion-attribution capability is claimed. The platform reports the supported scan information shown in the analytics workspace." }] },
  { path: "/inventory-qr-codes", title: "Inventory and Asset QR Codes | IEOSUIA QR", description: "Link QR codes to inventory records for supported item identification, movement history, stock counts and controlled workflows.", eyebrow: "Inventory QR codes", heading: "Connect QR codes to inventory records", intro: "Use inventory-linked QR codes for products, equipment and assets when a physical record needs identification and controlled history.", sections: [
    { title: "Identify items", body: "Associate a QR code with a supported inventory item and location so authorised users can find the correct record." },
    { title: "Record controlled movements", body: "Supported workflows include stock changes, checkout and return, transfers, maintenance states and reconciliation." },
    { title: "Keep history accountable", body: "Movement and stock-count history is available to authorised users and is not exposed as public search content.", links: [{ label: "Review inventory documentation", href: "/docs" }] },
  ] },
  { path: "/use-cases", title: "Business QR Code Use Cases | IEOSUIA QR", description: "Practical QR code uses for products, menus, events, schools, churches, equipment, assets and business information.", eyebrow: "Practical examples", heading: "Useful QR code workflows for everyday organisations", intro: "These examples describe ways to use current QR creation, destination management, scan reporting and inventory linking without claiming industry-specific integrations.", sections: [
    { title: "Retail and restaurants", body: "Connect product packaging, shelf displays or table signage to current product information, a menu URL, contact information or feedback form." },
    { title: "Events, schools and churches", body: "Share schedules, locations, resources or contact details, and use inventory links for managed equipment where appropriate." },
    { title: "Equipment and business information", body: "Identify assets and equipment through supported inventory records, or direct visitors to current business information with a managed code.", links: [{ label: "Explore all QR solutions", href: "/solutions" }] },
  ] },
  { path: "/pricing", title: "IEOSUIA QR Pricing | Start Free", description: "Start using IEOSUIA QR free and review current account access and product information without a permanent free-forever promise.", eyebrow: "Pricing", heading: "Start with IEOSUIA QR for free", intro: "Create an account to use the currently available QR tools. This page does not make a permanent unlimited or free-forever commitment.", sections: [
    { title: "Start free", body: "Create an account through IEOSUIA Central Auth and begin with the available QR creation and management workflow." },
    { title: "Current terms apply", body: "Any applicable service limits or future commercial terms will be communicated accurately through the service and its terms." },
    { title: "Need organisational guidance?", body: "Contact IEOSUIA to discuss a specific organisational workflow or implementation question.", links: [{ label: "Contact IEOSUIA QR", href: "/contact" }] },
  ] },
  { path: "/faq", title: "QR Code FAQ | IEOSUIA QR", description: "Answers about dynamic QR codes, scan tracking, destination updates, inventory links, brand customisation and IEOSUIA QR access.", eyebrow: "Frequently asked questions", heading: "Answers about IEOSUIA QR Codes", intro: "Clear answers based on the currently supported product behaviour.", sections: [{ title: "Need step-by-step guidance?", body: "The documentation explains current creation, management, analytics, inventory and download workflows.", links: [{ label: "Read IEOSUIA QR documentation", href: "/docs" }] }], faq: [
    { question: "What is a dynamic QR code?", answer: "A supported dynamic QR code uses a managed destination that can be updated without replacing the printed code." },
    { question: "Can I track QR code scans?", answer: "Yes. The authenticated analytics workspace reports supported scan totals, unique scans, trends, devices, approximate locations and recent activity." },
    { question: "Can I link QR codes to inventory?", answer: "Yes. Supported inventory records can be associated with QR codes for item identification and controlled workflows." },
    { question: "Can I add brand colours or a logo?", answer: "Supported design controls include colours, patterns, frames and logo placement. Test every customised code before distributing it." },
    { question: "Is IEOSUIA QR free?", answer: "You can start free. Current terms and any applicable usage limits govern access; IEOSUIA does not make a permanent free-forever commitment." },
    { question: "What happens if I deactivate a QR code?", answer: "A deactivated managed code no longer behaves as an active code. Exact handling depends on its supported QR workflow." },
  ] },
  { path: "/popia-compliance", title: "POPIA and Privacy Information | IEOSUIA QR", description: "Understand IEOSUIA QR privacy practices and POPIA-aware handling of account, QR and scan-related information.", eyebrow: "Privacy information", heading: "POPIA-aware information handling", intro: "This page explains the privacy principles applied to IEOSUIA QR. It is not a legal certification or an unconditional compliance guarantee.", sections: [
    { title: "Purpose and access", body: "Information is processed to provide supported account, QR, analytics and inventory functionality, with private areas protected by authentication and authorization." },
    { title: "Public and private boundaries", body: "Private QR records, destinations, scan history, analytics and inventory records are excluded from the sitemap and are not published as public SEO content." },
    { title: "Questions and requests", body: "Use the privacy and contact pages for questions about access, correction, deletion or other privacy matters.", links: [{ label: "Read the privacy policy", href: "/privacy" }, { label: "Contact IEOSUIA", href: "/contact" }] },
  ] },
];

export const getPublicPage = (pathname: string) => publicPages.find((page) => page.path === pathname);
