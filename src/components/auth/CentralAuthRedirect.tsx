import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { IEOSUIAQrLogo } from "@/components/brand/IEOSUIAQrLogo";
import { sanitizeReturnTo } from "@/lib/returnTo";

export default function CentralAuthRedirect({ mode = "login", callback = false }: { mode?: "login" | "signup" | "admin"; callback?: boolean }) {
  const location = useLocation();
  useLayoutEffect(() => {
    const admin = mode === "admin";
    const queryTarget = sanitizeReturnTo(new URLSearchParams(location.search).get("return_to"), admin);
    if (queryTarget) sessionStorage.setItem(admin ? "ieosuia_admin_return_to" : "ieosuia_return_to", queryTarget);
    const storedTarget = sanitizeReturnTo(sessionStorage.getItem(admin ? "ieosuia_admin_return_to" : "ieosuia_return_to"), admin);
    const signedOut = localStorage.getItem("ieosuia_explicit_logout");
    const token = new URLSearchParams(window.location.hash.slice(1)).get("ieosuia_token");
    if (token) { if (signedOut) { window.location.replace("/?signed_out=1"); return; } localStorage.setItem("auth_token", token); sessionStorage.removeItem("ieosuia_return_to"); window.location.replace(storedTarget || "/dashboard"); return; }
    const adminToken = new URLSearchParams(window.location.hash.slice(1)).get("ieosuia_admin_token");
    if (adminToken) { if (signedOut) { window.location.replace("/?signed_out=1"); return; } localStorage.setItem("admin_token", adminToken); localStorage.setItem("admin_last_activity", Date.now().toString()); sessionStorage.removeItem("ieosuia_admin_return_to"); window.location.replace(storedTarget || "/admin/dashboard"); return; }
    if (callback) { window.location.replace("/?sso=invalid_response"); return; }
    const fresh = signedOut ? "prompt=login" : "";
    localStorage.removeItem("ieosuia_explicit_logout");
    const query = mode === "signup" ? "?screen_hint=signup" : mode === "admin" ? `?account_type=admin${fresh ? `&${fresh}` : ""}` : fresh ? `?${fresh}` : "";
    window.location.replace(`/api/auth/ieosuia/start${query}`);
  }, [mode, callback, location.search]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950" aria-live="polite">
      <div className="w-full max-w-sm space-y-5 px-6">
        <IEOSUIAQrLogo variant="dark" className="mx-auto w-[220px] sm:w-[260px]" />
        <div className="mx-auto h-5 w-44 animate-pulse rounded bg-slate-800" />
        <div className="h-12 animate-pulse rounded-xl bg-slate-800" />
        <div className="h-12 animate-pulse rounded-xl bg-slate-800" />
        <p className="text-center text-sm text-slate-500">Connecting securely to IEOSUIA Auth…</p>
      </div>
    </main>
  );
}
