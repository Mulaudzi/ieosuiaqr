import { get, post } from "./client";
import {
  AnalyticsSummary,
  ApiResponse,
  PaginatedResponse,
  ReportRequest,
  ReportResponse,
  ScanLog,
} from "./types";

// Analytics & Scan Tracking endpoints - ready for Laravel backend
export const analyticsApi = {
  /**
   * Get scan logs for a QR code (Pro/Enterprise only)
   * GET /api/v1/qr/:id/scans
   */
  getScans: async (
    qrId: string,
    params?: {
      start_date?: string;
      end_date?: string;
      device_type?: string;
      country?: string;
      page?: number;
      per_page?: number;
    }
  ): Promise<PaginatedResponse<ScanLog>> => {
    return get(`/qr/${qrId}/scans`, params as Record<string, unknown>);
  },

  /**
   * Get analytics summary for user's QR codes
   * GET /api/v1/analytics/summary
   */
  getSummary: async (params?: {
    start_date?: string;
    end_date?: string;
    qr_ids?: string[];
  }): Promise<ApiResponse<AnalyticsSummary>> => {
    return get("/analytics/summary", params as Record<string, unknown>);
  },

  /**
   * Get top performing QR codes
   * GET /api/v1/analytics/top-qr-codes
   */
  getTopQRCodes: async (params?: {
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<Array<{
    qr_id: string;
    qr_name: string;
    qr_type: string;
    scan_count: number;
    change_percent: number;
  }>>> => {
    return get("/analytics/top-qr-codes", params as Record<string, unknown>);
  },

  /**
   * Get device breakdown
   * GET /api/v1/analytics/devices
   */
  getDeviceBreakdown: async (params?: {
    start_date?: string;
    end_date?: string;
    qr_ids?: string[];
  }): Promise<ApiResponse<Array<{
    device_type: string;
    browser: string;
    os: string;
    count: number;
    percentage: number;
  }>>> => {
    return get("/analytics/devices", params as Record<string, unknown>);
  },

  /**
   * Get geographic distribution (Enterprise only)
   * GET /api/v1/analytics/geo
   */
  getGeoDistribution: async (params?: {
    start_date?: string;
    end_date?: string;
    qr_ids?: string[];
  }): Promise<ApiResponse<Array<{
    country: string;
    country_code: string;
    city: string | null;
    latitude: number;
    longitude: number;
    count: number;
  }>>> => {
    return get("/analytics/geo", params as Record<string, unknown>);
  },

  /**
   * Get hourly distribution
   * GET /api/v1/analytics/hourly
   */
  getHourlyDistribution: async (params?: {
    start_date?: string;
    end_date?: string;
    qr_ids?: string[];
  }): Promise<ApiResponse<Array<{ hour: number; count: number }>>> => {
    return get("/analytics/hourly", params as Record<string, unknown>);
  },

  /**
   * Get daily trend
   * GET /api/v1/analytics/daily
   */
  getDailyTrend: async (params?: {
    start_date?: string;
    end_date?: string;
    qr_ids?: string[];
  }): Promise<ApiResponse<Array<{ date: string; count: number }>>> => {
    return get("/analytics/daily", params as Record<string, unknown>);
  },

  /**
   * Export analytics report
   * POST /api/v1/reports/export
   */
  exportReport: async (data: ReportRequest): Promise<ApiResponse<ReportResponse>> => {
    return post("/reports/export", data);
  },

  /**
   * Log a scan (public endpoint - no auth required)
   * POST /api/v1/scan/log
   * Called when QR code is scanned
   */
  logScan: async (data: {
    qr_id?: string;
    dynamic_id?: string;
  }): Promise<ApiResponse<{ redirect_url: string }>> => {
    return post("/scan/log", data);
  },
};

// Scan redirect helper
export const scanHelpers = {
  /**
   * Generate scan tracking URL for QR codes
   * Users scan this URL, which logs the scan and redirects to actual content
   */
  getScanUrl: (qrId: string, isDynamic: boolean = false): string => {
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    if (isDynamic) {
      return `${baseUrl}/scan?dynamic_id=${qrId}`;
    }
    return `${baseUrl}/scan?id=${qrId}`;
  },
};
