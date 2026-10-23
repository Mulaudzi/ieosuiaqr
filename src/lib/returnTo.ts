const FORBIDDEN = /^\/(?:login|signup|auth\/callback|admin\/auth\/callback|admin\/login|guymhan)(?:[/?#]|$)/;

export function sanitizeReturnTo(value: unknown, admin = false): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\r\n\\]/.test(value) || FORBIDDEN.test(value)) return null;
  if (admin && !value.startsWith("/admin/")) return null;
  if (!admin && value.startsWith("/admin/")) return null;
  return value;
}

export function currentReturnTo(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}
