import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function credentials(file: string) {
  return Object.fromEntries(
    fs.readFileSync(path.resolve('.private', file), 'utf8').split(/\r?\n/).flatMap((line) => {
      const match = line.match(/^- ([^:]+):\s*(.+)$/);
      return match ? [[match[1], match[2]]] : [];
    }),
  );
}

async function login(page: Page) {
  const account = credentials('LOCAL_TEST_ACCOUNT.md');
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('dashboard-tutorial-seen', 'true');
  });
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(account.Email);
  await page.locator('input[type="password"]').fill(account.Password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
}

async function loginAdmin(page: Page) {
  const account = credentials('LOCAL_ADMIN_TEST_ACCOUNT.md');
  await page.goto('/admin/login');
  await page.getByPlaceholder('admin@example.com').fill(account.Email);
  await page.getByPlaceholder('Enter password 1').fill(account['Password 1']);
  await page.getByPlaceholder('Enter password 2').fill(account['Password 2']);
  await page.getByPlaceholder('Enter password 3').fill(account['Password 3']);
  await page.getByRole('button', { name: /access admin panel/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 30_000 });
}

async function assertResponsive(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle' });
  await expect(page.locator('body')).not.toContainText('Something went wrong');
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document, `${route} document overflow`).toBeLessThanOrEqual(dimensions.viewport + 1);
}

for (const device of [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
]) {
  test(`${device.name} layouts remain app-like and free of horizontal overflow`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: device.width, height: device.height });
    for (const route of [
      '/', '/solutions', '/solutions/retail', '/support', '/contact', '/docs', '/careers',
      '/terms', '/privacy', '/cookies', '/login', '/signup', '/forgot-password', '/admin', '/admin/login',
    ]) {
      await assertResponsive(page, route);
    }

    await login(page);
    for (const route of [
      '/dashboard', '/dashboard/inventory', '/dashboard/analytics', '/dashboard/settings',
      '/dashboard/create', '/dashboard/profile', '/dashboard/inventory/analytics',
    ]) {
      await assertResponsive(page, route);
    }

    await page.goto('/dashboard');
    const mobileNav = page.getByRole('navigation', { name: /dashboard navigation/i });
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByText('QR Codes', { exact: true })).toBeVisible();
    await expect(mobileNav.getByText('Inventory', { exact: true })).toBeVisible();
    await expect(mobileNav.getByText('Analytics', { exact: true })).toBeVisible();
    await expect(mobileNav.getByText('Settings', { exact: true })).toBeVisible();

    await loginAdmin(page);
    for (const route of [
      '/admin/dashboard', '/admin/emails', '/admin/settings', '/admin/stats',
      '/admin/create', '/admin/users', '/admin/audit',
    ]) {
      await assertResponsive(page, route);
    }
  });
}
