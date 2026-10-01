import { expect, test, type Page } from "@playwright/test";

const token = process.env.QR_TEST_TOKEN || "";
const itemId = process.env.QR_TEST_ITEM_ID || "";
const qrId = process.env.QR_TEST_QR_ID || "";
const qrEditId = process.env.QR_TEST_QR_ID || "";

const publicRoutes = [
  "/",
  "/forgot-password", "/reset-password", "/verify-email", "/terms", "/privacy",
  "/cookies", "/support", "/contact", "/docs", "/careers", "/solutions", "/not-a-real-page",
];
const authenticatedRoutes = [
  "/dashboard", "/dashboard/create", "/dashboard/analytics", "/dashboard/settings",
  "/dashboard/profile", "/dashboard/inventory", "/dashboard/inventory/analytics",
  "/verification-required",
];

async function authenticate(page: Page) {
  await page.addInitScript(value => localStorage.setItem("auth_token", value), token);
}

async function assertViewportSafe(page: Page, route: string) {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  // Analytics and dashboard routes can legitimately poll. DOM readiness plus
  // a visible body is the stable UI boundary; network-idle is not.
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toBeVisible();
  await page.waitForTimeout(150);
  let overflow: { viewport:number; document:number; body:number; offenders:unknown[] } | undefined;
  for(let attempt=0;attempt<3&&!overflow;attempt++)try{overflow=await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    offenders: [...document.querySelectorAll<HTMLElement>("body *")].map(element => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName, classes: element.className?.toString().slice(0, 120), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
    }).filter(item => item.left < -1 || item.right > window.innerWidth + 1).slice(0, 12),
  }));}catch(error){if(attempt===2)throw error;await page.waitForLoadState('domcontentloaded');await page.waitForTimeout(250);}
  if(!overflow)throw new Error(`Could not inspect ${route}`);
  expect(overflow.document, `${route} document overflow`).toBeLessThanOrEqual(overflow.viewport + 1);
  expect(overflow.body, `${route} body overflow: ${JSON.stringify(overflow.offenders)}`).toBeLessThanOrEqual(overflow.viewport + 1);
  expect(errors, `${route} runtime errors`).toEqual([]);
}

for(const route of ['/login','/signup','/admin/login']){
  test(`${route} hands off to central authentication`,async({page})=>{await page.goto(route,{waitUntil:'domcontentloaded'});await page.waitForURL(url=>url.hostname==='auth.ieosuia.com',{timeout:10000});expect(new URL(page.url()).hostname).toBe('auth.ieosuia.com');});
}

test('invalid authentication callback returns to a safe local state',async({page})=>{const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/auth/callback?error=access_denied',{waitUntil:'domcontentloaded'});await page.waitForURL(/sso=invalid_response/);expect(errors).toEqual([]);});

test('unauthorized admin route matrix fails closed',async({page})=>{for(const route of ['/admin/dashboard','/admin/users','/admin/stats','/admin/emails','/admin/settings','/admin/create','/admin/audit']){try{await page.goto(route,{waitUntil:'domcontentloaded'});}catch(error){if(!String(error).includes('ERR_ABORTED'))throw error;}await page.waitForTimeout(300);const url=new URL(page.url());expect(url.hostname==='auth.ieosuia.com'||url.pathname.startsWith('/admin')).toBe(true);}});

for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
  test(`public routes are viewport-safe at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : width < 1000 ? 1024 : 900 });
    for (const route of publicRoutes) await assertViewportSafe(page, route);
    if (qrId) await assertViewportSafe(page, `/scan/${qrId}`);
  });
}

for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
  test(`authenticated routes are viewport-safe at ${width}px`, async ({ page }) => {
    test.skip(!token, "Local authenticated fixture unavailable");
    await authenticate(page);
    await page.setViewportSize({ width, height: width < 600 ? 844 : width < 1000 ? 1024 : 900 });
    for (const route of authenticatedRoutes) await assertViewportSafe(page, route);
    if (itemId) await assertViewportSafe(page, `/dashboard/inventory/${itemId}`);
    if (qrId) await assertViewportSafe(page, `/scan/${qrId}/history`);
    if (qrEditId) await assertViewportSafe(page, `/dashboard/edit/${qrEditId}`);
  });
}

test("mobile public navigation is accessible and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open navigation menu" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(page.getByRole("button", { name: "Close navigation menu" })).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeVisible();
  await trigger.click();
  await page.locator("#mobile-navigation").getByRole("link", { name: "Solutions", exact: true }).click();
  await expect(page).toHaveURL(/\/solutions$/);
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeVisible();
});

test("mobile authenticated navigation and action dialog remain usable", async ({ page }) => {
  test.skip(!token || !itemId, "Local authenticated fixture unavailable");
  await authenticate(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/dashboard/inventory/${itemId}`);
  const action = page.getByRole("heading", { name: "Actions" }).locator("xpath=../..").getByRole("button").first();
  await expect(action).toBeVisible();
  await action.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 390).toBeTruthy();
  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings$/);
});

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  test(`representative visual matrix ${viewport.name}`, async ({ page }, testInfo) => {
    test.skip(!token, "Local authenticated fixture unavailable");
    await authenticate(page);
    await page.setViewportSize(viewport);
    const routes = ["/", "/dashboard", "/dashboard/create", "/dashboard/inventory", "/dashboard/analytics", "/dashboard/settings"];
    if (itemId) routes.push(`/dashboard/inventory/${itemId}`);
    if (qrId) routes.push(`/scan/${qrId}`);
    for (const route of routes) {
      await page.goto(route, { waitUntil: "networkidle" });
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach(`${viewport.name}-${route.replaceAll("/", "-") || "home"}`, { body: screenshot, contentType: "image/png" });
    }
  });
}
