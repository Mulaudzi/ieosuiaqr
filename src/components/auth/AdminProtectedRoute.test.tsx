import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AdminProtectedRoute } from './AdminProtectedRoute';

function LoginLocation() { const location = useLocation(); return <p>{location.pathname}{location.search}</p>; }
function page() { return render(<MemoryRouter initialEntries={['/admin/users?sort=name']}><Routes><Route path="/admin/users" element={<AdminProtectedRoute><p>Protected administrators</p></AdminProtectedRoute>} /><Route path="/guymhan/login" element={<LoginLocation />} /></Routes></MemoryRouter>); }
beforeEach(() => { localStorage.clear(); vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('Guymhan uses the existing server-verified QR admin context', () => {
  it('does not treat a customer token as an administrator session', async () => {
    localStorage.setItem('auth_token', 'customer-only'); page();
    expect(await screen.findByText('/guymhan/login?return_to=%2Fadmin%2Fusers%3Fsort%3Dname')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled(); expect(screen.queryByText('Protected administrators')).not.toBeInTheDocument();
  });
  it('requires server verification before rendering admin content', async () => {
    localStorage.setItem('admin_token', 'admin-test-only'); vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 })); page();
    expect(await screen.findByText('Protected administrators')).toBeInTheDocument(); expect(fetch).toHaveBeenCalledWith('/api/admin/auth/session', expect.objectContaining({ headers: { Authorization: 'Bearer admin-test-only' } }));
  });
  it('rejects revoked administrator tokens and retains the intended destination', async () => {
    localStorage.setItem('admin_token', 'revoked'); vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 401 })); page();
    expect(await screen.findByText('/guymhan/login?return_to=%2Fadmin%2Fusers%3Fsort%3Dname')).toBeInTheDocument(); expect(localStorage.getItem('admin_token')).toBeNull();
  });
});
