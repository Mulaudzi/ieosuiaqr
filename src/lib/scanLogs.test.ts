import { describe, expect, it } from "vitest";
import { formatScanDate, normalizeScanLog } from "./scanLogs";

describe("scan log normalization", () => {
  it("maps the API timestamp and nested metadata into the history view", () => {
    const scan = normalizeScanLog({
      id: "12",
      timestamp: "2026-08-29 10:42:45",
      location: { city: "Johannesburg", country: "South Africa" },
      device: { browser: "Chrome", platform: "Android", is_mobile: true },
    });

    expect(scan.scanned_at).toBe("2026-08-29 10:42:45");
    expect(scan.location).toBe("Johannesburg, South Africa");
    expect(scan.device_type).toBe("mobile");
    expect(scan.browser).toBe("Chrome");
    expect(scan.os).toBe("Android");
    expect(formatScanDate(scan.scanned_at, "MMM d, yyyy")).toBe("Aug 29, 2026");
  });

  it("renders malformed legacy timestamps safely", () => {
    const scan = normalizeScanLog({ id: "13", timestamp: null });
    expect(formatScanDate(scan.scanned_at, "MMM d, yyyy")).toBe("Unknown date");
  });
});
