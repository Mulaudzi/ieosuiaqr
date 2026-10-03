# IEOSUIA QR SEO upgrade — 2026-10-03

Status: **implemented and locally verified; not deployed in this cycle**.

## Scope delivered

- Preserved crawler-readable homepage HTML and added ten distinct public pages for features, dynamic QR codes, South African discovery, branding, analytics, inventory, use cases, pricing, FAQ, and POPIA information.
- Added unique titles, descriptions, canonicals, Open Graph and Twitter metadata to generated public HTML.
- Added `WebSite`, `Organization`, `SoftwareApplication`, `WebPage`, `BreadcrumbList`, and visible-content-aligned `FAQPage` structured data where appropriate.
- Expanded the sitemap to 27 canonical public URLs and retained private route exclusions.
- Added `/llms.txt` containing public information only.
- Added descriptive internal feature links and crawlable IEOSUIA Invoices and SMS links.
- Replaced fabricated solution case studies, quotes, outcome figures, and unsupported integrations with factual workflows and explicit limitations.
- Added canonical trailing-slash redirects for non-root public pages.

## Local evidence

- TypeScript: PASS.
- Unit tests: PASS — 37/37.
- Production web build: PASS — 3,927 modules.
- SEO validation: PASS — 27 canonical pages, unique metadata, one H1, structured data, meaningful initial HTML, and private-route exclusions.
- Responsive browser verification: PASS — 7/7 tests over 360, 390, 430, 768, 1440, and 1920 pixels.
- Lint: PASS with 0 errors and 27 pre-existing warnings.

## Known boundaries

- No production deployment or live-domain `curl` verification was performed in this cycle.
- Lighthouse is not installed in the repository, so no new Lighthouse score is claimed.
- Search Console and Bing verification tokens were not supplied and were not invented.
- The largest remaining performance opportunities are the main application bundle and large source logo PNGs; the public route pages themselves are code-split and their crawler HTML is small.
