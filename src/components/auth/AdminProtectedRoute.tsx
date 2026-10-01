import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const token = localStorage.getItem("admin_token");

  if (!token) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/admin/login?return_to=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <>{children}</>;
}
