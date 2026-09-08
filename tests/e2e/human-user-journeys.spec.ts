import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const api = 'http://localhost:8081/api';
const account = Object.fromEntries(
  fs.readFileSync(path.resolve('.private/LOCAL_TEST_ACCOUNT.md'), 'utf8').split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^- ([^:]+):\s*(.+)$/);
    return match ? [[match[1], match[2]]] : [];
  }),
);

async function loginApi(request: APIRequestContext) {
  const response = await request.post(`${api}/auth/login`, { data: { email: account.Email, password: account.Password } });
  expect(response.status()).toBe(200);
  return (await response.json()).data.tokens.access_token as string;
}

async function loginUi(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('dashboard-tutorial-seen', 'true');
  });
  await page.goto('/login');
  await page.getByPlaceholder('you@example.com').fill(account.Email);
  await page.locator('input[type="password"]').fill(account.Password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

function runtimeFailures(page: Page) {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 500) failures.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  return failures;
}

test.describe.serial('human-style populated user journeys', () => {
  let token = '';
  let qrId = 0;
  let inventoryId = 0;
  let combinedQrId = 0;
  let combinedInventoryId = 0;
  const unique = `Human Journey ${Date.now()}`;

  test.beforeAll(async ({ request }) => {
    token = await loginApi(request);
    const headers = { Authorization: `Bearer ${token}` };
    const qr = await request.post(`${api}/qr`, { headers, data: {
      type: 'url', name: `${unique} QR`, content: { content: 'https://example.com/human-journey' },
      custom_options: { fgColor: '#0066aa', bgColor: '#ffffff' },
    } });
    qrId = Number((await qr.json()).data.id);
    const item = await request.post(`${api}/inventory`, { headers, data: {
      qr_id: qrId, name: `${unique} Asset`, category: 'Testing', status: 'in_stock', location: 'Human Test Lab',
    } });
    inventoryId = Number((await item.json()).data.id);
    await request.get(`${api}/scan/log?id=${qrId}`, { headers: { 'User-Agent': `Human-Journey-Scanner-${Date.now()}` }, maxRedirects: 0 });
  });

  test.afterAll(async ({ request }) => {
    const headers = { Authorization: `Bearer ${token}` };
    if (inventoryId) await request.delete(`${api}/inventory/${inventoryId}`, { headers });
    if (qrId) await request.delete(`${api}/qr/${qrId}`, { headers });
    if (combinedInventoryId) await request.delete(`${api}/inventory/${combinedInventoryId}`, { headers });
    if (combinedQrId) await request.delete(`${api}/qr/${combinedQrId}`, { headers });
  });

  test('inventory controls and populated scan-history modal work as a person expects', async ({ page }) => {
    const failures = runtimeFailures(page);
    await loginUi(page);
    await page.goto('/dashboard/inventory');
    await expect(page.getByText(`${unique} Asset`)).toBeVisible();

    await page.getByPlaceholder('Search items...').fill(unique);
    await expect(page.getByText(`${unique} Asset`)).toBeVisible();
    await page.getByRole('button', { name: `Actions for ${unique} Asset` }).click();
    await page.getByRole('menuitem', { name: /scan history/i }).click();
    const history = page.getByRole('dialog', { name: /scan history/i });
    await expect(history).toBeVisible();
    await expect(history.getByText(/scan #1/i)).toBeVisible();
    await expect(history).not.toContainText('Unknown date');
    await history.getByRole('button', { name: /close/i }).click();

    await page.getByRole('button', { name: `Actions for ${unique} Asset` }).click();
    await page.getByRole('menuitem', { name: /^edit$/i }).click();
    const editItem = page.getByRole('dialog', { name: /edit inventory item/i });
    await expect(editItem).toBeVisible();
    await expect(editItem.getByLabel(/link to existing qr code/i)).toBeChecked();
    await editItem.getByRole('button', { name: /close/i }).click();

    await page.getByRole('button', { name: /bulk import/i }).click();
    await expect(page.getByRole('dialog', { name: /bulk import inventory/i })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /close/i }).click();

    await page.getByRole('button', { name: /qr \+ item/i }).click();
    await expect(page.getByRole('dialog', { name: /create qr \+ inventory item/i })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /close/i }).click();

    await page.getByRole('button', { name: /print labels/i }).click();
    await expect(page.getByRole('dialog', { name: /print qr labels/i })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click();
    expect(failures).toEqual([]);
  });

  test('dashboard search, QR actions, modal, list view, and edit navigation work', async ({ page }) => {
    const failures = runtimeFailures(page);
    await loginUi(page);
    await page.getByPlaceholder('Search QR codes...').fill(unique);
    await expect(page.getByText(`${unique} QR`)).toBeVisible();
    await page.getByRole('button', { name: `Actions for ${unique} QR` }).click();
    await page.getByRole('menuitem', { name: /^view$/i }).click();
    const view = page.getByRole('dialog', { name: new RegExp(`${unique} QR`) });
    await expect(view).toBeVisible();
    await expect(view.getByText(/scans/i).first()).toBeVisible();
    await view.getByRole('button', { name: /close/i }).click();

    const viewToggle = page.locator('[data-tutorial="view-toggle"]');
    await viewToggle.locator('button').nth(1).click();
    await expect(page.getByRole('button', { name: `View ${unique} QR` })).toBeVisible();
    await page.getByRole('button', { name: `Edit ${unique} QR` }).click();
    await expect(page).toHaveURL(new RegExp(`/dashboard/edit/${qrId}`));
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByLabel('QR Code Name *')).toHaveValue(`${unique} QR`);
    expect(failures).toEqual([]);
  });

  test('combined QR and inventory creation produces a linked, scannable item', async ({ page, request }) => {
    const failures = runtimeFailures(page);
    const combinedName = `${unique} Combined Asset`;
    await loginUi(page);
    await page.goto('/dashboard/inventory');
    await page.getByRole('button', { name: /qr \+ item/i }).click();
    const dialog = page.getByRole('dialog', { name: /create qr \+ inventory item/i });
    await dialog.getByLabel('Item Name *').fill(combinedName);
    await dialog.getByRole('button', { name: /create qr \+ item/i }).click();
    await expect(dialog.getByText(/all done/i)).toBeVisible();
    await dialog.getByRole('button', { name: /^done$/i }).click();

    const headers = { Authorization: `Bearer ${token}` };
    const inventory = await request.get(`${api}/inventory?search=${encodeURIComponent(combinedName)}`, { headers });
    const inventoryItems = (await inventory.json()).data as Array<{ id: number; qr_id: number; name: string }>;
    const createdItem = inventoryItems.find((item) => item.name === combinedName);
    expect(createdItem).toBeTruthy();
    combinedInventoryId = Number(createdItem!.id);
    combinedQrId = Number(createdItem!.qr_id);

    const qr = await request.get(`${api}/qr/${combinedQrId}`, { headers });
    expect((await qr.json()).data.content.url).toBe(`http://localhost:5173/scan/${combinedQrId}`);
    const scan = await request.get(`${api}/scan/log?id=${combinedQrId}`, { maxRedirects: 0 });
    expect(scan.status()).toBe(302);
    expect(scan.headers().location).toBe(`http://localhost:5173/scan/${combinedQrId}`);
    expect(failures).toEqual([]);
  });
});
