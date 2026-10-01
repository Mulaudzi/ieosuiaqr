import { expect, test, type Page } from '@playwright/test';

async function login(page: Page) {
  const token=process.env.QR_TEST_TOKEN||'';expect(token).toBeTruthy();
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('dashboard-tutorial-seen', 'true');
  });
  await page.addInitScript(value=>localStorage.setItem('auth_token',value),token);
  await page.goto('/dashboard');await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
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
      '/terms', '/privacy', '/cookies', '/forgot-password', '/admin',
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

  });
}
