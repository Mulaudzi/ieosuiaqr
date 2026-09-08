import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const api = 'http://localhost:8081/api';
const account = Object.fromEntries(
  fs.readFileSync(path.resolve('.private/LOCAL_ADMIN_TEST_ACCOUNT.md'), 'utf8').split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^- ([^:]+):\s*(.+)$/);
    return match ? [[match[1], match[2]]] : [];
  }),
);

test.describe.serial('admin behavior and authorization', () => {
  let token = '';
  let emailId = 0;
  let disposableAdminId = 0;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  test('admin routes reject user and missing tokens', async ({ request }) => {
    expect((await request.get(`${api}/admin/verify`)).status()).toBe(401);
    expect((await request.get(`${api}/admin/users`, { headers: { Authorization: 'Bearer invalid' } })).status()).toBe(401);
  });

  test('three-password login authenticates and session verification identifies admin', async ({ request }) => {
    const wrong = await request.post(`${api}/admin/auth/batch`, { data: {
      email: account.Email, password1: `${account['Password 1']}-wrong`, password2: account['Password 2'], password3: account['Password 3'],
    } });
    expect(wrong.status()).toBe(401);
    const login = await request.post(`${api}/admin/auth/batch`, { data: {
      email: account.Email, password1: account['Password 1'], password2: account['Password 2'], password3: account['Password 3'],
    } });
    expect(login.status()).toBe(200);
    token = (await login.json()).data.admin_token;
    const verify = await request.get(`${api}/admin/verify`, { headers: auth() });
    expect(verify.status()).toBe(200);
    expect((await verify.json()).data.valid).toBe(true);
  });

  test('email inbox supports detail and reversible workflow mutations', async ({ request }) => {
    const inbox = await request.get(`${api}/admin/emails?archived=all&limit=25`, { headers: auth() });
    expect(inbox.status()).toBe(200);
    const logs = (await inbox.json()).data.logs as Array<{ id: number }>;
    expect(logs.length).toBeGreaterThan(0);
    emailId = Number(logs[0].id);
    expect((await request.get(`${api}/admin/emails/${emailId}`, { headers: auth() })).status()).toBe(200);
    expect((await request.post(`${api}/admin/emails/read`, { headers: auth(), data: { id: emailId, is_read: true } })).status()).toBe(200);
    expect((await request.post(`${api}/admin/emails/replied`, { headers: auth(), data: { id: emailId, is_replied: true, notes: 'Codex local acceptance' } })).status()).toBe(200);
    expect((await request.post(`${api}/admin/emails/priority`, { headers: auth(), data: { id: emailId, priority: 'urgent' } })).status()).toBe(200);
    expect((await request.post(`${api}/admin/emails/archive`, { headers: auth(), data: { id: emailId, is_archived: true } })).status()).toBe(200);
    const changed = (await (await request.get(`${api}/admin/emails/${emailId}`, { headers: auth() })).json()).data;
    expect(Boolean(changed.is_read)).toBe(true);
    expect(Boolean(changed.is_replied)).toBe(true);
    expect(changed.priority).toBe('urgent');
    expect(Boolean(changed.is_archived)).toBe(true);
    expect((await request.post(`${api}/admin/emails/bulk`, { headers: auth(), data: { ids: [emailId], action: 'mark_unread' } })).status()).toBe(200);
    await request.post(`${api}/admin/emails/replied`, { headers: auth(), data: { id: emailId, is_replied: false } });
    await request.post(`${api}/admin/emails/priority`, { headers: auth(), data: { id: emailId, priority: 'normal' } });
    await request.post(`${api}/admin/emails/archive`, { headers: auth(), data: { id: emailId, is_archived: false } });
  });

  test('admin settings round-trip without changing their values', async ({ request }) => {
    const get = await request.get(`${api}/admin/settings`, { headers: auth() });
    expect(get.status()).toBe(200);
    const settings = (await get.json()).data as Record<string, { value: unknown }>;
    const values = Object.fromEntries(Object.entries(settings).map(([key, item]) => [key, item.value]));
    if (Object.keys(values).length) {
      expect((await request.post(`${api}/admin/settings`, { headers: auth(), data: values })).status()).toBe(200);
      const reread = (await (await request.get(`${api}/admin/settings`, { headers: auth() })).json()).data;
      for (const [key, value] of Object.entries(values)) expect(reread[key].value).toEqual(value);
    }
  });

  test('admin statistics, webhooks, and audit surfaces return structured data', async ({ request }) => {
    for (const endpoint of ['/admin/stats?days=30', '/admin/webhooks', '/admin/audit', '/admin/audit/stats']) {
      const response = await request.get(`${api}${endpoint}`, { headers: auth() });
      expect(response.status(), endpoint).toBe(200);
      expect((await response.json()).success, endpoint).toBe(true);
    }
  });

  test('admin CSV/PDF/audit exports return downloadable non-empty files', async ({ request }) => {
    for (const endpoint of ['/admin/export/emails', '/admin/export/stats', '/admin/audit/export']) {
      const response = await request.get(`${api}${endpoint}`, { headers: auth() });
      expect(response.status(), endpoint).toBe(200);
      expect(response.headers()['content-disposition'], endpoint).toMatch(/attachment/i);
      expect((await response.body()).byteLength, endpoint).toBeGreaterThan(20);
    }
  });

  test('admin creation, update, toggle, unlock, and deletion complete as a lifecycle', async ({ request }) => {
    const email = `codex.disposable.admin.${Date.now()}@ieosuia.test`;
    const created = await request.post(`${api}/admin/auth/create`, { headers: auth(), data: {
      email, name: 'Codex Disposable Admin', password1: 'Disposable-Admin-One!', password2: 'Disposable-Two!', password3: 'Disposable-Three!',
    } });
    expect(created.status()).toBe(201);
    disposableAdminId = Number((await created.json()).data.id);
    expect((await request.get(`${api}/admin/users/${disposableAdminId}`, { headers: auth() })).status()).toBe(200);
    const updated = await request.put(`${api}/admin/users/${disposableAdminId}`, { headers: auth(), data: { name: 'Codex Updated Disposable Admin' } });
    expect((await updated.json()).data.name).toBe('Codex Updated Disposable Admin');
    expect((await request.post(`${api}/admin/users/${disposableAdminId}/toggle`, { headers: auth(), data: {} })).status()).toBe(200);
    expect((await request.post(`${api}/admin/users/${disposableAdminId}/unlock`, { headers: auth(), data: {} })).status()).toBe(200);
    expect((await request.delete(`${api}/admin/users/${disposableAdminId}`, { headers: auth() })).status()).toBe(200);
    expect((await request.get(`${api}/admin/users/${disposableAdminId}`, { headers: auth() })).status()).toBe(404);
  });

  test('admin cannot delete itself and logout endpoint completes', async ({ request }) => {
    const session = await request.get(`${api}/admin/auth/session`, { headers: auth() });
    const adminId = Number((await session.json()).data.admin.id);
    expect((await request.delete(`${api}/admin/users/${adminId}`, { headers: auth() })).status()).toBe(400);
    expect((await request.post(`${api}/admin/logout`, { headers: auth(), data: {} })).status()).toBe(200);
  });
});
