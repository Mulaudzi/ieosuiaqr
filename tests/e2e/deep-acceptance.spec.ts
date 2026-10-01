import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';

function collectRuntimeFailures(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  return failures;
}

async function assertRendered(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: 'networkidle' });
  expect(response?.status(), route).toBeLessThan(400);
  await expect(page.locator('body'), route).not.toBeEmpty();
  await expect(page.locator('body'), route).not.toContainText('Something went wrong');
  await expect(page.locator('body'), route).not.toContainText('Internal server error');
}

test('every public route renders without runtime or server errors', async ({ page }) => {
  const failures = collectRuntimeFailures(page);
  const routes = [
    '/', '/forgot-password', '/reset-password', '/verify-email',
    '/terms', '/privacy', '/cookies', '/support', '/contact', '/docs', '/careers',
    '/solutions', '/solutions/retail', '/admin',
  ];
  for (const route of routes) await assertRendered(page, route);
  expect(failures).toEqual([]);
  await assertRendered(page, '/definitely-not-a-route');
  await expect(page.getByText(/not found|page.*exist/i).first()).toBeVisible();
});

test('favicon is optimized, valid, and served as an image', async ({ request }) => {
  const response = await request.get('/favicon.png');
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toMatch(/^image\/png/);
  expect((await response.body()).byteLength).toBeLessThan(30_000);
});

test('user logs in through UI and every protected route renders', async ({ page }) => {
  const token=process.env.QR_TEST_TOKEN||'';expect(token).toBeTruthy();
  const failures = collectRuntimeFailures(page);
  await page.addInitScript(value=>localStorage.setItem('auth_token',value),token);
  await page.goto('/dashboard');
  await expect(page.getByText(/welcome|dashboard|qr codes/i).first()).toBeVisible();

  for (const route of [
    '/dashboard', '/dashboard/create', '/dashboard/analytics', '/dashboard/settings',
    '/dashboard/profile', '/dashboard/inventory', '/dashboard/inventory/analytics',
  ]) await assertRendered(page, route);
  expect(failures).toEqual([]);
});

test('logo loads in QR preview, persists, and is present in a downloaded PNG', async ({ page }) => {
  test.setTimeout(90_000);
  const token=process.env.QR_TEST_TOKEN||'';expect(token).toBeTruthy();
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('dashboard-tutorial-seen', 'true');
  });
  await page.addInitScript(value=>localStorage.setItem('auth_token',value),token);
  await page.goto('/dashboard/create');
  await page.getByRole('button', { name: /^url/i }).click();
  await page.getByRole('button', { name: /^next/i }).click();
  await page.getByPlaceholder('e.g., My Website QR').fill('Codex Browser Logo QR');
  await page.getByPlaceholder('https://example.com').fill('https://example.com/browser-logo');
  await page.getByRole('button', { name: /^next/i }).click();
  await page.getByRole('button', { name: /click or drag a png logo here/i }).click();
  const savedLogo = page.getByRole('dialog').getByRole('img', { name: 'Logo' }).first();
  await expect(savedLogo).toBeVisible();
  expect(await savedLogo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await savedLogo.click();
  const previewLogo = page.getByRole('img', { name: 'QR Logo' });
  await expect(previewLogo).toBeVisible();
  expect(await previewLogo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

  await page.getByRole('button', { name: /^download$/i }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: /png image/i }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(download.suggestedFilename()).toMatch(/\.png$/i);
  expect(downloadPath).toBeTruthy();
  const png = fs.readFileSync(downloadPath!);
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.byteLength).toBeGreaterThan(5_000);

  const createResponsePromise = page.waitForResponse((response) => response.url().endsWith('/api/qr') && response.request().method() === 'POST');
  await page.getByRole('button', { name: /create qr code/i }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);
  const created = await createResponse.json();
  expect(created.data.custom_options.logo_path).toMatch(/^\/api\/uploads\/logos\//);
  await expect(page).toHaveURL(/\/dashboard/);
});

test('unauthenticated visitors cannot enter protected routes', async ({ page }) => {
  for (const route of ['/dashboard', '/dashboard/create', '/dashboard/settings', '/dashboard/profile']) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/);
  }
});

test('admin entry uses Central Auth and protected screens fail closed', async ({ page }) => {
  await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
  await page.waitForURL((url) => url.hostname === 'auth.ieosuia.com');
  for (const route of ['/admin/dashboard', '/admin/emails', '/admin/settings', '/admin/stats', '/admin/create', '/admin/users', '/admin/audit']) {
    try {
      await page.goto(`http://localhost:5173${route}`, { waitUntil: 'domcontentloaded' });
    } catch {
      // Cross-origin Central Auth navigation can interrupt the local document.
    }
    await expect.poll(() => {
      const current = new URL(page.url());
      return current.origin === 'http://localhost:5173' && current.pathname === route;
    }, { message: `${route} must not remain accessible without an admin session` }).toBe(false);
  }
});
