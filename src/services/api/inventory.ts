import { del, get, post, put } from "./client";
import { ApiResponse, PaginatedResponse } from "./types";

export type InventoryStatus = "in_stock" | "out" | "maintenance" | "checked_out";

export interface InventoryItem {
  id: string;
  user_id: string;
  qr_id: string | null;
  name: string;
  category: string;
  notes: string | null;
  status: InventoryStatus;
  location: string | null;
  last_scan_date: string | null;
  qr_preview?: string;
  created_at: string;
  updated_at: string;
  shared_access?: string[]; // Enterprise: user IDs with access
}

export interface CreateInventoryRequest {
  qr_id?: string;
  name: string;
  category: string;
  notes?: string;
  status?: InventoryStatus;
  location?: string;
}

export interface UpdateInventoryRequest {
  name?: string;
  category?: string;
  notes?: string;
  status?: InventoryStatus;
  location?: string;
}

export const inventoryApi = {
  /**
   * Get all inventory items for current user (paginated)
   * GET /api/inventory
   */
  list: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    status?: InventoryStatus;
  }): Promise<PaginatedResponse<InventoryItem>> => {
    return get("/inventory", params);
  },

  /**
   * Get single inventory item by ID
   * GET /api/inventory/:id
   */
  get: async (id: string): Promise<ApiResponse<InventoryItem>> => {
    return get(`/inventory/${id}`);
  },

  /**
   * Create a new inventory item
   * POST /api/inventory
   */
  create: async (data: CreateInventoryRequest): Promise<ApiResponse<InventoryItem>> => {
    return post("/inventory", data);
  },

  /**
   * Update an existing inventory item
   * PUT /api/inventory/:id
   */
  update: async (id: string, data: UpdateInventoryRequest): Promise<ApiResponse<InventoryItem>> => {
    return put(`/inventory/${id}`, data);
  },

  /**
   * Delete an inventory item
   * DELETE /api/inventory/:id
   */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return del(`/inventory/${id}`);
  },

  /**
   * Log a scan for an inventory item (public)
   * POST /api/inventory/scan
   */
  logScan: async (qrId: string, location?: string): Promise<ApiResponse<{ item: InventoryItem }>> => {
    return post("/inventory/scan", { qr_id: qrId, location });
  },

  /**
   * Get inventory limits for current user's plan
   */
  getLimits: async (): Promise<ApiResponse<{ max_items: number; current_count: number; can_edit: boolean }>> => {
    return get("/inventory/limits");
  },

  /**
   * Get inventory item by QR code ID (public endpoint)
   * GET /api/inventory/qr/:qrId
   */
  getByQrCode: async (qrId: string, location?: string): Promise<ApiResponse<{ item: InventoryItem | null; is_owner: boolean }>> => {
    return get(`/inventory/qr/${qrId}`, { location });
  },

  /**
   * Public endpoint to update item status (authorized users only)
   * POST /api/inventory/qr/:qrId/status
   */
  publicUpdateStatus: async (qrId: string, data: { status: InventoryStatus; location?: string }): Promise<ApiResponse<InventoryItem>> => {
    return post(`/inventory/qr/${qrId}/status`, data);
  },
};
