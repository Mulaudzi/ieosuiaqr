import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = localStorage.getItem("admin_token");
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setAuthorized(false);
      return;
    }
    const controller = new AbortController();
    void fetch("/api/admin/auth/session", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then((response) => {
      if (!response.ok) throw new Error("Invalid admin session");
      setAuthorized(true);
      localStorage.setItem("admin_last_activity", Date.now().toString());
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_last_activity");
      setAuthorized(false);
    });
    return () => controller.abort();
  }, [token]);

  if (!token || authorized === false) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/admin/login?return_to=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (authorized !== true) {
    return <main className="min-h-screen grid place-items-center bg-background" role="status" aria-label="Verifying administrator access"><div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" /></main>;
  }

  return <>{children}</>;
}
