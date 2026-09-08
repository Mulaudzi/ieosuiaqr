import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const api = 'http://localhost:8081/api';
const fields = (file: string) => Object.fromEntries(
  fs.readFileSync(path.resolve('.private', file), 'utf8').split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^- ([^:]+):\s*(.+)$/);
    return match ? [[match[1], match[2]]] : [];
  }),
);

test.describe.serial('exact API behavior and lifecycle', () => {
  let token = '';
  let qrId = 0;
  let presetId = '';
  let inventoryId = 0;
  const account = fields('LOCAL_TEST_ACCOUNT.md');
const auth = () => ({ Authorization: `Bearer ${token}` });

  test('authentication rejects malformed and wrong credentials without leaking details', async ({ request }) => {
    const malformed = await request.post(`${api}/auth/login`, { data: { email: 'not-an-email', password: 'x' } });
    expect(malformed.status()).toBe(422);
    const wrong = await request.post(`${api}/auth/login`, { data: { email: account.Email, password: `${account.Password}-wrong` } });
    expect(wrong.status()).toBe(401);
    expect((await wrong.json()).message).not.toMatch(/hash|sql|password.*database/i);
  });

  test('login returns usable tokens and private routes enforce authentication', async ({ request }) => {
    const denied = await request.get(`${api}/user/profile`);
    expect(denied.status()).toBe(401);
    const response = await request.post(`${api}/auth/login`, { data: { email: account.Email, password: account.Password } });
    expect(response.status()).toBe(200);
    const body = await response.json();
    token = body.data.tokens.access_token;
    expect(token).toBeTruthy();
    const profile = await request.get(`${api}/user/profile`, { headers: auth() });
    expect(profile.status()).toBe(200);
    expect((await profile.json()).data.email).toBe(account.Email);
  });

  test('logo upload stores a retrievable real image', async ({ request }) => {
    const image = fs.readFileSync(path.resolve('public/favicon.png'));
    const upload = await request.post(`${api}/user/logos`, {
      headers: auth(),
      multipart: { logo: { name: 'codex-logo.png', mimeType: 'image/png', buffer: image }, name: 'Codex Acceptance Logo' },
    });
    expect(upload.status()).toBe(201);
    const saved = (await upload.json()).data;
    expect(saved.logo_path).toMatch(/^\/api\/uploads\/logos\//);
    const file = await request.get(`http://localhost:8081${saved.logo_path}`);
    expect(file.status()).toBe(200);
    expect(file.headers()['content-type']).toMatch(/^image\/png/);
    expect((await file.body()).byteLength).toBeGreaterThan(100);
    const list = await request.get(`${api}/user/logos`, { headers: auth() });
    expect((await list.json()).data.some((logo: { id: number }) => logo.id === saved.id)).toBeTruthy();
  });

  test('avatar upload returns an image URL that a browser can retrieve', async ({ request }) => {
    const image = fs.readFileSync(path.resolve('public/favicon.png'));
    const upload = await request.post(`${api}/user/avatar`, {
      headers: auth(), multipart: { avatar: { name: 'codex-avatar.png', mimeType: 'image/png', buffer: image } },
    });
    expect(upload.status()).toBe(200);
    const avatarUrl = (await upload.json()).data.avatar_url as string;
    const normalizedUrl = avatarUrl.replace('http://localhost:5173/api/', 'http://localhost:8081/api/');
    const file = await request.get(normalizedUrl);
    expect(file.status()).toBe(200);
    expect(file.headers()['content-type']).toMatch(/^image\/png/);
  });

  test('2FA API surface is disabled', async ({ request }) => {
    for (const endpoint of ['/user/2fa/enable', '/user/2fa/verify', '/user/2fa/disable']) {
      expect((await request.post(`${api}${endpoint}`, { headers: auth(), data: {} })).status(), endpoint).toBe(404);
    }
  });

  test('QR CRUD preserves content/design and scan redirects exactly once', async ({ request }) => {
    const create = await request.post(`${api}/qr`, {
      headers: auth(),
      data: {
        type: 'url', name: 'Codex Exact Redirect QR',
        content: { content: 'https://example.com/expected-destination' },
        custom_options: { fgColor: '#0066aa', bgColor: '#ffffff', logo: '/api/uploads/logos/test.png' },
      },
    });
    expect(create.status()).toBe(201);
    qrId = (await create.json()).data.id;
    const before = await request.get(`${api}/qr/${qrId}`, { headers: auth() });
    const beforeData = (await before.json()).data;
    expect(beforeData.content.content).toBe('https://example.com/expected-destination');
    expect(beforeData.custom_options.logo).toBe('/api/uploads/logos/test.png');
    const scan1 = await request.get(`${api}/scan/log?id=${qrId}`, { headers: { 'User-Agent': 'Codex-Acceptance-Scanner/1.0' }, maxRedirects: 0 });
    expect(scan1.status()).toBe(302);
    expect(scan1.headers().location).toBe('https://example.com/expected-destination');
    const scan2 = await request.get(`${api}/scan/log?id=${qrId}`, { headers: { 'User-Agent': 'Codex-Acceptance-Scanner/1.0' }, maxRedirects: 0 });
    expect(scan2.status()).toBe(302);
    const after = await request.get(`${api}/qr/${qrId}`, { headers: auth() });
    expect(Number((await after.json()).data.total_scans) - Number(beforeData.total_scans)).toBe(1);
    const scans = await request.get(`${api}/qr/${qrId}/scans`, { headers: auth() });
    expect((await scans.json()).data.some((scan: { user_agent: string }) => scan.user_agent === 'Codex-Acceptance-Scanner/1.0')).toBeTruthy();
  });

  test('deactivated QR returns 410 and reactivation restores redirect', async ({ request }) => {
    expect((await request.put(`${api}/qr/${qrId}`, { headers: auth(), data: { is_active: false } })).status()).toBe(200);
    expect((await request.get(`${api}/scan/log?id=${qrId}`, { maxRedirects: 0 })).status()).toBe(410);
    expect((await request.put(`${api}/qr/${qrId}`, { headers: auth(), data: { is_active: true } })).status()).toBe(200);
    expect((await request.get(`${api}/scan/log?id=${qrId}`, { maxRedirects: 0 })).status()).toBe(302);
  });

  test('bulk CSV validates rows and creates only valid QR records', async ({ request }) => {
    const csv = Buffer.from('type,content,name\nurl,https://example.com/bulk,Codex Bulk Valid\nbadtype,no,Codex Bulk Invalid\n');
    const response = await request.post(`${api}/qr/bulk`, {
      headers: auth(), multipart: { file: { name: 'acceptance.csv', mimeType: 'text/csv', buffer: csv } },
    });
    expect(response.status()).toBe(200);
    const data = (await response.json()).data;
    expect(data.created).toBe(1);
    expect(data.errors).toHaveLength(1);
  });

  test('inventory lifecycle changes state, records history, and deletes cleanly', async ({ request }) => {
    const create = await request.post(`${api}/inventory`, { headers: auth(), data: {
      qr_id: qrId, name: 'Codex Lifecycle Asset', category: 'Testing', status: 'in_stock', location: 'Lab A', notes: 'Acceptance fixture',
    } });
    expect(create.status()).toBe(201);
    inventoryId = (await create.json()).data.id;
    const duplicateLink = await request.post(`${api}/inventory`, { headers: auth(), data: {
      qr_id: qrId, name: 'Duplicate QR Asset', category: 'Testing', status: 'in_stock',
    } });
    expect(duplicateLink.status()).toBe(409);

    const inventoryScan = await request.get(`${api}/scan/log?id=${qrId}`, {
      headers: { 'User-Agent': `Codex-Inventory-Link-${Date.now()}` }, maxRedirects: 0,
    });
    expect(inventoryScan.status()).toBe(302);
    const scannedItem = await request.get(`${api}/inventory/${inventoryId}`, { headers: auth() });
    expect((await scannedItem.json()).data.last_scan_date).toBeTruthy();

    expect((await request.put(`${api}/inventory/${inventoryId}`, { headers: auth(), data: { qr_id: null } })).status()).toBe(200);
    const unlinked = await request.get(`${api}/inventory/qr/${qrId}`);
    expect((await unlinked.json()).data.item).toBeNull();
    expect((await request.put(`${api}/inventory/${inventoryId}`, { headers: auth(), data: { qr_id: qrId } })).status()).toBe(200);

    expect((await request.put(`${api}/inventory/${inventoryId}`, {
      headers: auth(), data: { status: 'maintenance', location: 'Repair Bench' },
    })).status()).toBe(200);
    expect((await request.post(`${api}/inventory/qr/${qrId}/status`, { headers: auth(), data: { status: 'out', location: 'Field' } })).status()).toBe(200);
    const item = await request.get(`${api}/inventory/${inventoryId}`, { headers: auth() });
    expect((await item.json()).data.status).toBe('out');
    const history = await request.get(`${api}/inventory/qr/${qrId}/history`, { headers: auth() });
    const historyEntries = (await history.json()).data.data as Array<{ new_status: string }>;
    expect(historyEntries.some((entry) => entry.new_status === 'maintenance')).toBeTruthy();
    expect(historyEntries.some((entry) => entry.new_status === 'out')).toBeTruthy();
    expect((await request.delete(`${api}/inventory/${inventoryId}`, { headers: auth() })).status()).toBe(200);
    expect((await request.get(`${api}/inventory/${inventoryId}`, { headers: auth() })).status()).toBe(404);
  });

  test('design preset lifecycle persists default state and deletes cleanly', async ({ request }) => {
    const create = await request.post(`${api}/design-presets`, { headers: auth(), data: {
      name: 'Codex Exact Preset', description: 'Acceptance fixture', design_options: { fgColor: '#123456', shapeStyle: 'rounded' },
    } });
    expect(create.status()).toBe(201);
    presetId = String((await create.json()).data.id);
    expect((await request.post(`${api}/design-presets/${presetId}/set-default`, { headers: auth(), data: {} })).status()).toBe(200);
    const read = await request.get(`${api}/design-presets/${presetId}`, { headers: auth() });
    expect(Boolean((await read.json()).data.is_default)).toBeTruthy();
    expect((await request.delete(`${api}/design-presets/${presetId}`, { headers: auth() })).status()).toBe(200);
    expect((await request.get(`${api}/design-presets/${presetId}`, { headers: auth() })).status()).toBe(404);
  });

  test('CSV exports are files with expected structure, not JSON success shells', async ({ request }) => {
    for (const endpoint of ['/analytics/export', '/inventory/analytics/export']) {
      const response = await request.get(`${api}${endpoint}`, { headers: auth() });
      expect(response.status(), endpoint).toBe(200);
      expect(response.headers()['content-type'], endpoint).toMatch(/text\/csv/);
      expect(response.headers()['content-disposition'], endpoint).toMatch(/attachment/i);
      expect((await response.text()).split(/\r?\n/)[0], endpoint).toContain(',');
    }
  });

  test('invalid reset token is rejected and QR cleanup is complete', async ({ request }) => {
    const invalid = await request.post(`${api}/auth/reset-password`, { data: { token: 'invalid-token', password: account.Password } });
    expect(invalid.status()).toBe(400);
    expect((await request.delete(`${api}/qr/${qrId}`, { headers: auth() })).status()).toBe(200);
    expect((await request.get(`${api}/qr/${qrId}`, { headers: auth() })).status()).toBe(404);
  });

  test('password reset email contains a working single-use token and login still succeeds', async ({ request }) => {
    const forgot = await request.post(`${api}/auth/forgot-password`, { data: { email: account.Email } });
    expect(forgot.status()).toBe(200);
    const mailbox = await request.get('http://localhost:8025/api/v1/messages');
    const summaries = (await mailbox.json()).messages as Array<{ ID: string; Subject: string; To: Array<{ Address: string }> }>;
    const summary = summaries.find((message) => message.Subject.includes('Reset your password') && message.To.some((to) => to.Address === account.Email));
    expect(summary).toBeTruthy();
    const message = await request.get(`http://localhost:8025/api/v1/message/${summary!.ID}`);
    const content = await message.json();
    const match = `${content.Text}\n${content.HTML}`.match(/[?&]token=([a-f0-9]{64})/i);
    expect(match).toBeTruthy();
    const reset = await request.post(`${api}/auth/reset-password`, { data: { token: match![1], password: account.Password } });
    expect(reset.status()).toBe(200);
    expect((await request.post(`${api}/auth/reset-password`, { data: { token: match![1], password: account.Password } })).status()).toBe(400);
    expect((await request.post(`${api}/auth/login`, { data: { email: account.Email, password: account.Password } })).status()).toBe(200);
  });

  test('a disposable local account can register and permanently delete itself', async ({ request }) => {
    const password = 'Codex-Disposable-Delete-2026!';
    const email = `codex.acceptance.${Date.now()}@gmail.com`;
    const register = await request.post(`${api}/auth/register`, { data: { name: 'Codex Disposable User', email, password } });
    expect(register.status()).toBe(201);
    const disposableToken = (await register.json()).data.tokens.access_token as string;
    expect((await request.post(`${api}/user/delete`, { headers: { Authorization: `Bearer ${disposableToken}` }, data: { password: `${password}-wrong` } })).status()).toBe(401);
    expect((await request.post(`${api}/user/delete`, { headers: { Authorization: `Bearer ${disposableToken}` }, data: { password } })).status()).toBe(200);
    expect((await request.post(`${api}/auth/login`, { data: { email, password } })).status()).toBe(401);
  });
});
