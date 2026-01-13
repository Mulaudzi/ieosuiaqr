import { del, get, post, put, uploadFile } from "./client";
import {
  ApiResponse,
  BulkCreateQRCodeRequest,
  CreateQRCodeRequest,
  PaginatedResponse,
  QRCode,
  UpdateQRCodeRequest,
} from "./types";

// QR Code endpoints - ready for Laravel backend
export const qrCodeApi = {
  /**
   * Get all QR codes for current user (paginated)
   * GET /api/v1/qr
   */
  list: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    type?: string;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  }): Promise<PaginatedResponse<QRCode>> => {
    return get("/qr", params);
  },

  /**
   * Get single QR code by ID
   * GET /api/v1/qr/:id
   */
  get: async (id: string): Promise<ApiResponse<QRCode>> => {
    return get(`/qr/${id}`);
  },

  /**
   * Create a new QR code
   * POST /api/v1/qr/create
   */
  create: async (data: CreateQRCodeRequest): Promise<ApiResponse<QRCode>> => {
    return post("/qr/create", data);
  },

  /**
   * Update an existing QR code
   * PUT /api/v1/qr/:id
   */
  update: async (id: string, data: UpdateQRCodeRequest): Promise<ApiResponse<QRCode>> => {
    return put(`/qr/${id}`, data);
  },

  /**
   * Delete a QR code
   * DELETE /api/v1/qr/:id
   */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return del(`/qr/${id}`);
  },

  /**
   * Bulk create QR codes (Enterprise only)
   * POST /api/v1/qr/bulk-create
   */
  bulkCreate: async (data: BulkCreateQRCodeRequest): Promise<ApiResponse<{ created: number; failed: number; qr_codes: QRCode[] }>> => {
    return post("/qr/bulk-create", data);
  },

  /**
   * Bulk create from CSV file (Enterprise only)
   * POST /api/v1/qr/bulk-import
   */
  bulkImportCSV: async (file: File): Promise<ApiResponse<{ created: number; failed: number; errors: string[] }>> => {
    const formData = new FormData();
    formData.append("file", file);
    return uploadFile("/qr/bulk-import", formData);
  },

  /**
   * Download QR code image
   * GET /api/v1/qr/:id/download
   */
  download: async (id: string, format: "png" | "svg" | "pdf" = "png"): Promise<Blob> => {
    const response = await get<Blob>(`/qr/${id}/download?format=${format}`);
    return response;
  },

  /**
   * Get QR code statistics
   * GET /api/v1/qr/:id/stats
   */
  getStats: async (id: string): Promise<ApiResponse<{
    total_scans: number;
    unique_scans: number;
    last_scan: string | null;
    top_device: string;
    top_country: string;
  }>> => {
    return get(`/qr/${id}/stats`);
  },

  /**
   * Regenerate QR code image (with new customization)
   * POST /api/v1/qr/:id/regenerate
   */
  regenerate: async (id: string): Promise<ApiResponse<{ image_url: string }>> => {
    return post(`/qr/${id}/regenerate`);
  },
};
