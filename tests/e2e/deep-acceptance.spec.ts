import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function privateFields(file: string) {
  const text = fs.readFileSync(path.resolve('.private', file), 'utf8');
  return Object.fromEntries(
    text.split(/\r?\n/).flatMap((line) => {
      const match = line.match(/^- ([^:]+):\s*(.+)$/);
      return match ? [[match[1], match[2]]] : [];
    }),
  );
}

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
    '/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email',
    '/terms', '/privacy', '/cookies', '/support', '/contact', '/docs', '/careers',
    '/solutions', '/solutions/retail', '/admin', '/admin/login',
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
  const account = privateFields('LOCAL_TEST_ACCOUNT.md');
  const failures = collectRuntimeFailures(page);
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(account.Email);
  await page.locator('input[type="password"]').fill(account.Password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/welcome|dashboard|qr codes/i).first()).toBeVisible();

  for (const route of [
    '/dashboard', '/dashboard/create', '/dashboard/analytics', '/dashboard/settings',
    '/dashboard/profile', '/dashboard/inventory', '/dashboard/inventory/analytics',
  ]) await assertRendered(page, route);
  expect(failures).toEqual([]);
});

test('logo loads in QR preview, persists, and is present in a downloaded PNG', async ({ page }) => {
  test.setTimeout(90_000);
  const account = privateFields('LOCAL_TEST_ACCOUNT.md');
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('dashboard-tutorial-seen', 'true');
  });
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(account.Email);
  await page.locator('input[type="password"]').fill(account.Password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
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

test('admin logs in through UI and every admin screen renders', async ({ page }) => {
  const account = privateFields('LOCAL_ADMIN_TEST_ACCOUNT.md');
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'accepted'));
  const failures = collectRuntimeFailures(page);
  await page.goto('/admin/login');
  await page.getByPlaceholder('admin@example.com').fill(account.Email);
  await page.getByPlaceholder('Enter password 1').fill(account['Password 1']);
  await page.getByPlaceholder('Enter password 2').fill(account['Password 2']);
  await page.getByPlaceholder('Enter password 3').fill(account['Password 3']);
  await page.getByRole('button', { name: /access admin panel/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);

  for (const route of [
    '/admin/dashboard', '/admin/emails', '/admin/settings', '/admin/stats',
    '/admin/create', '/admin/users', '/admin/audit',
  ]) await assertRendered(page, route);
  expect(failures).toEqual([]);
});
