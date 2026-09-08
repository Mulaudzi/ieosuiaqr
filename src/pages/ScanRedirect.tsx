import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowRight, Check, Copy, ExternalLink, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import ieosuiaLogo from "@/assets/ieosuia-qr-logo-blue.png";
import { parseSocialLinks } from "@/lib/socialLinks";

type ScanPayload = {
  redirect_url: string | null;
  type: string;
  content: unknown;
};

type ScanResponse = {
  success: boolean;
  message?: string;
  data?: ScanPayload;
};

const API_URL = (import.meta.env.VITE_API_URL || "https://qr.ieosuia.com/api").replace(/\/$/, "");

function readableLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function contentRows(content: unknown): Array<[string, string]> {
  if (typeof content === "string") return [["Content", content]];
  if (!content || typeof content !== "object" || Array.isArray(content)) return [];

  return Object.entries(content as Record<string, unknown>).flatMap(([key, value]) => {
    if (value === null || value === undefined || value === "") return [];
    if (key === "links" && typeof value === "string") {
      try {
        const links = JSON.parse(value) as Array<{ platform?: string; url?: string }>;
        return links
          .filter((link) => link.url)
          .map((link) => [link.platform || "Link", link.url || ""] as [string, string]);
      } catch {
        // Display the original value below when an older record is not JSON.
      }
    }
    if (typeof value === "object") return [];
    return [[readableLabel(key), String(value)] as [string, string]];
  });
}

export default function ScanRedirect() {
  const { id } = useParams<{ id: string }>();
  const started = useRef(false);
  const [payload, setPayload] = useState<ScanPayload | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const rows = useMemo(() => contentRows(payload?.content), [payload?.content]);
  const socialLinks = useMemo(
    () => payload?.type === "social" ? parseSocialLinks(payload.content) : [],
    [payload]
  );

  useEffect(() => {
    if (!id || started.current) return;
    started.current = true;
    const controller = new AbortController();

    fetch(`${API_URL}/scan/log?id=${encodeURIComponent(id)}&response=json`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as ScanResponse;
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "This QR code could not be opened.");
        }
        setPayload(result.data);
        if (result.data.redirect_url) {
          window.setTimeout(() => window.location.replace(result.data!.redirect_url!), 650);
        }
      })
      .catch((reason: unknown) => {
        if ((reason as { name?: string }).name !== "AbortError") {
          setError(reason instanceof Error ? reason.message : "This QR code could not be opened.");
        }
      });

    return () => controller.abort();
  }, [id]);

  const copyValue = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1500);
  };

  const isLoading = !payload && !error;
  const hasDestination = Boolean(payload?.redirect_url);

  return (
    <main className="fixed inset-0 z-[100] grid min-h-[100dvh] place-items-center overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-4 text-slate-900">
      <section className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-2xl shadow-cyan-950/10 sm:p-8">
        <img src={ieosuiaLogo} alt="IEOSUIA QR" className="mx-auto mb-6 h-16 w-auto max-w-[240px] object-contain sm:h-20" />

        {isLoading && (
          <div role="status" aria-live="polite" className="py-8">
            <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-cyan-50 text-primary">
              <Loader2 className="h-10 w-10 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold">Opening your QR code</h1>
            <p className="mt-3 text-slate-600">Please wait while we prepare your destination.</p>
          </div>
        )}

        {payload && hasDestination && (
          <div className="py-6" role="status" aria-live="polite">
            <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-emerald-50 text-emerald-600">
              <ArrowRight className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold">Your destination is ready</h1>
            <p className="mt-3 text-slate-600">It should open automatically.</p>
            <Button className="mt-7 h-12 w-full text-base" onClick={() => window.location.assign(payload.redirect_url!)}>
              <ExternalLink className="mr-2 h-5 w-5" />
              Open destination
            </Button>
            <p className="mt-3 text-xs text-slate-500">If nothing happens, press the button above.</p>
          </div>
        )}

        {payload && !hasDestination && (
          <div className="py-4">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-cyan-50 text-primary">
              <QrCode className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold">{socialLinks.length ? "Choose a link" : "QR code content"}</h1>
            <p className="mt-2 text-slate-600">
              {socialLinks.length ? "Select where you would like to go." : "Here is the information shared by this QR code."}
            </p>
            {socialLinks.length > 0 && (
              <div className="mt-6 space-y-3">
                {socialLinks.map((link, index) => link.href ? (
                  <Button key={`${link.platform}-${index}`} asChild variant="outline" className="h-auto min-h-14 w-full justify-between rounded-2xl px-4 py-3 text-left">
                    <a href={link.href} target="_self" rel="noopener noreferrer">
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">{readableLabel(link.platform)}</span>
                        <span className="mt-1 block break-all text-sm text-slate-900">{link.url}</span>
                      </span>
                      <ExternalLink className="ml-3 h-5 w-5 shrink-0 text-primary" />
                    </a>
                  </Button>
                ) : (
                  <div key={`${link.platform}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{readableLabel(link.platform)}</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="break-all text-sm font-medium">{link.url}</p>
                      <button className="rounded-lg p-2 text-slate-500 hover:bg-white" onClick={() => copyValue(link.platform, link.url)} aria-label={`Copy ${link.platform}`}>
                        {copied === link.platform ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 space-y-3 text-left">
              {socialLinks.length === 0 && (rows.length > 0 ? rows.map(([label, value]) => (
                <div key={`${label}-${value}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words text-sm font-medium">{value}</p>
                    <button className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white" onClick={() => copyValue(label, value)} aria-label={`Copy ${label}`}>
                      {copied === label ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )) : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">No viewable content was provided.</p>)}
            </div>
          </div>
        )}

        {error && (
          <div className="py-8" role="alert">
            <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-amber-50 text-amber-600">
              <QrCode className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold">Unable to open this QR code</h1>
            <p className="mt-3 text-slate-600">{error}</p>
            <Button variant="outline" className="mt-7 h-12 w-full" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        )}

        <p className="mt-6 border-t border-slate-100 pt-5 text-xs text-slate-400">Powered by IEOSUIA QR</p>
      </section>
    </main>
  );
}
