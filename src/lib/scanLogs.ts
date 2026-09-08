import { format } from "date-fns";

export interface ScanLogView {
  id: string;
  qr_id?: string;
  ip_hash?: string;
  location: string | null;
  city: string | null;
  country: string | null;
  device_type: string;
  browser: string;
  os: string;
  scanned_at: string;
}

interface RawScanLog extends Partial<ScanLogView> {
  timestamp?: string | null;
  location?: string | { city?: string | null; country?: string | null } | null;
  device?: {
    browser?: string | null;
    platform?: string | null;
    is_mobile?: boolean;
  } | null;
}

export function normalizeScanLog(scan: RawScanLog): ScanLogView {
  const locationData = typeof scan.location === "object" ? scan.location : null;
  const city = scan.city ?? locationData?.city ?? null;
  const country = scan.country ?? locationData?.country ?? null;
  const location = typeof scan.location === "string"
    ? scan.location
    : [city, country].filter(Boolean).join(", ") || null;

  return {
    id: String(scan.id ?? ""),
    qr_id: scan.qr_id ? String(scan.qr_id) : undefined,
    ip_hash: scan.ip_hash,
    location,
    city,
    country,
    device_type: scan.device_type || (scan.device?.is_mobile ? "mobile" : "desktop"),
    browser: scan.browser || scan.device?.browser || "Unknown",
    os: scan.os || scan.device?.platform || "Unknown",
    scanned_at: scan.scanned_at || scan.timestamp || "",
  };
}

export function formatScanDate(value: string, pattern: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : format(date, pattern);
}
