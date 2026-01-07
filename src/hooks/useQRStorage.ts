import { useState, useEffect } from "react";

export interface StoredQRCode {
  id: string;
  name: string;
  type: string;
  content: string;
  contentData?: Record<string, string>;
  fgColor: string;
  bgColor: string;
  scans: number;
  created: string;
  status: "active" | "paused";
}

const STORAGE_KEY = "ieosuia_qr_codes";

export function useQRStorage() {
  const [qrCodes, setQRCodes] = useState<StoredQRCode[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setQRCodes(JSON.parse(stored));
      } catch {
        setQRCodes([]);
      }
    }
  }, []);

  const saveQRCode = (qr: Omit<StoredQRCode, "id" | "scans" | "created" | "status">) => {
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
  };

  const deleteQRCode = (id: string) => {
    const updated = qrCodes.filter((qr) => qr.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setQRCodes(updated);
  };

  const updateQRCode = (id: string, updates: Partial<StoredQRCode>) => {
    const updated = qrCodes.map((qr) =>
      qr.id === id ? { ...qr, ...updates } : qr
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setQRCodes(updated);
  };

  const getQRCodeCount = () => qrCodes.length;

  return {
    qrCodes,
    saveQRCode,
    deleteQRCode,
    updateQRCode,
    getQRCodeCount,
  };
}
