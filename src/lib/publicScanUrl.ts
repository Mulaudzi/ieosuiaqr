const APP_URL = (import.meta.env.VITE_APP_URL || "https://qr.ieosuia.com").replace(/\/$/, "");

export function publicScanUrl(qrId: string | number): string {
  return `${APP_URL}/go/${encodeURIComponent(String(qrId))}`;
}
