import { useState, useEffect, useCallback } from "react";
import { qrCodeApi } from "@/services/api";
import { QRCode, QRCodeContent } from "@/services/api/types";
import { parseApiError } from "@/services/api/client";
import { QRDesignOptions, defaultDesignOptions } from "@/components/qr/QRDesignCustomizer";
import { publicScanUrl } from "@/lib/publicScanUrl";

export interface StoredQRCode {
  id: string;
  name: string;
  type: string;
  content: string;          // raw destination (used for display/editing)
  scanUrl?: string;         // the URL encoded in the actual QR image (routes through scan logger)
  contentData?: Record<string, string>;
  fgColor: string;
  bgColor: string;
  designOptions: QRDesignOptions;
  scans: number;
  created: string;
  status: "active" | "paused";
}

// QR codes are cached in localStorage as a performance optimization
// This is NOT sensitive data - just a cache of public QR metadata
const STORAGE_KEY = "ieosuia_qr_codes";

// Convert API QRCode to StoredQRCode format
const apiToStored = (qr: QRCode & { total_scans?: number; custom_options?: Record<string, unknown> }): StoredQRCode => {
  // Build content string from QRCodeContent
  const content = qr.content;
  let contentStr = "";
  
  if (content.url) contentStr = content.url;
  else if (content.text) contentStr = content.text;
  else if (content.email) contentStr = content.email;
  else if (content.phone) contentStr = content.phone;
  else if (content.ssid) contentStr = content.ssid;
  else if (content.firstName || content.lastName) contentStr = `${content.firstName || ""} ${content.lastName || ""}`.trim();
  else if (content.eventTitle) contentStr = content.eventTitle;
  else if (content.locationName) contentStr = content.locationName;
  else contentStr = JSON.stringify(content);

  const scanCount = Number(qr.scan_count ?? qr.total_scans ?? 0);
  const customOptions = (qr as unknown as { custom_options?: Record<string, unknown> }).custom_options ?? {};
  const designOptions: QRDesignOptions = {
    ...defaultDesignOptions,
    ...customOptions,
    logo: (customOptions.logo_path as string | undefined) ?? (customOptions.logo as string | undefined) ?? null,
  } as QRDesignOptions;

  return {
    id: qr.id,
    name: qr.name,
    type: qr.type,
    content: contentStr,
    scanUrl: publicScanUrl(qr.id),
    contentData: content as unknown as Record<string, string>,
    fgColor: designOptions.fgColor || qr.customization?.foreground_color || "#000000",
    bgColor: designOptions.bgColor || qr.customization?.background_color || "#FFFFFF",
    designOptions,
    scans: Number.isFinite(scanCount) ? scanCount : 0,
    created: new Date(qr.created_at).toISOString().split("T")[0],
    status: "active",
  };
};

// Convert StoredQRCode to API format
const storedToApi = (qr: Omit<StoredQRCode, "id" | "scans" | "created" | "status">) => {
  // Build content object based on type
  let content: QRCodeContent = {};
  
  if (qr.contentData) {
    content = qr.contentData as unknown as QRCodeContent;
  } else {
    // Simple content - determine by type
    switch (qr.type) {
      case "url":
        content = { url: qr.content };
        break;
      case "text":
        content = { text: qr.content };
        break;
      case "email":
        content = { email: qr.content };
        break;
      case "phone":
        content = { phone: qr.content };
        break;
      default:
        content = { text: qr.content };
    }
  }

  return {
    name: qr.name,
    type: qr.type as QRCode["type"],
    content,
    customization: {
      foreground_color: qr.fgColor,
      background_color: qr.bgColor,
    },
    custom_options: {
      ...qr.designOptions,
      ...(qr.designOptions.logo ? { logo_path: qr.designOptions.logo } : {}),
    },
  };
};

export function useQRStorage() {
  const [qrCodes, setQRCodes] = useState<StoredQRCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  const isAuthenticated = () => !!localStorage.getItem("auth_token");

  // Load QR codes from API or localStorage
  const loadQRCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isAuthenticated()) {
        // Try API first
        const response = await qrCodeApi.list({ page: 1, per_page: 100 });
        const apiCodes = response.data.map(apiToStored);
        setQRCodes(apiCodes);
        // Also sync to localStorage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apiCodes));
      } else {
        // Fallback to localStorage for non-authenticated users
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setQRCodes(JSON.parse(stored));
        }
      }
    } catch (err) {
      console.warn("API fetch failed, falling back to localStorage:", err);
      // Fallback to localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setQRCodes(JSON.parse(stored));
        } catch {
          setQRCodes([]);
        }
      }
      setError("Failed to load QR codes from server. Showing cached data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQRCodes();
  }, [loadQRCodes]);

  const saveQRCode = async (qr: Omit<StoredQRCode, "id" | "scans" | "created" | "status">) => {
    setError(null);
    
    try {
      if (isAuthenticated()) {
        // Save to API
        const response = await qrCodeApi.create(storedToApi(qr));
        const newQR = apiToStored(response.data);
        const updated = [...qrCodes, newQR];
        setQRCodes(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return newQR;
      } else {
        // Save to localStorage only
        const newQR: StoredQRCode = {
          ...qr,
          id: crypto.randomUUID(),
          scans: 0,
          created: new Date().toISOString().split("T")[0],
          status: "active",
        };
        const updated = [...qrCodes, newQR];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setQRCodes(updated);
        return newQR;
      }
    } catch (err) {
      const parsed = parseApiError(err, "Failed to save QR code");
      if (import.meta.env.DEV) {
        console.warn("[useQRStorage] QR create error", {
          status: parsed.status,
          message: parsed.message,
          errors: parsed.details,
          data: parsed.data,
          payload: storedToApi(qr),
        });
      }

      // Fallback to localStorage
      const newQR: StoredQRCode = {
        ...qr,
        id: crypto.randomUUID(),
        scans: 0,
        created: new Date().toISOString().split("T")[0],
        status: "active",
      };
      const updated = [...qrCodes, newQR];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setQRCodes(updated);
      setError(`Saved locally. Server sync failed: ${parsed.message}`);
      return newQR;
    }
  };

  const deleteQRCode = async (id: string) => {
    setError(null);
    
    // Optimistic update
    const updated = qrCodes.filter((qr) => qr.id !== id);
    setQRCodes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      if (isAuthenticated()) {
        await qrCodeApi.delete(id);
      }
    } catch (err) {
      console.error("Failed to delete QR code from server:", err);
      // Keep local delete even if API fails
      setError("Deleted locally. Server sync may be pending.");
    }
  };

  const updateQRCode = async (id: string, updates: Partial<StoredQRCode>) => {
    setError(null);
    
    // Optimistic update
    const updated = qrCodes.map((qr) =>
      qr.id === id ? { ...qr, ...updates } : qr
    );
    setQRCodes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      if (isAuthenticated()) {
        await qrCodeApi.update(id, {
          name: updates.name,
          content: updates.contentData as QRCodeContent,
          customization: updates.fgColor || updates.bgColor ? {
            foreground_color: updates.fgColor,
            background_color: updates.bgColor,
          } : undefined,
        });
      }
    } catch (err) {
      console.error("Failed to update QR code on server:", err);
      setError("Updated locally. Server sync may be pending.");
    }
  };

  const getQRCodeCount = () => qrCodes.length;

  const refresh = () => loadQRCodes();

  return {
    qrCodes,
    isLoading,
    error,
    saveQRCode,
    deleteQRCode,
    updateQRCode,
    getQRCodeCount,
    refresh,
  };
}
