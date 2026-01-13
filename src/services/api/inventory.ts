import { del, get, post, put } from "./client";
import { ApiResponse, PaginatedResponse } from "./types";

export type InventoryStatus = "in_stock" | "out" | "maintenance" | "checked_out";

export interface InventoryAnalytics {
  summary: {
    total_items: number;
    total_scans: number;
    items_with_qr: number;
    items_without_qr: number;
  };
  status_distribution: Array<{ status: string; count: number; label: string }>;
  by_category: Array<{ category: string; count: number }>;
  scan_trend: Array<{ date: string; scans: number }>;
  status_changes: Array<{ date: string; new_status: string; changes: number }>;
  top_items: Array<{
    id: string;
    name: string;
    category: string;
    status: InventoryStatus;
    scan_count: number;
    last_scan: string | null;
  }>;
  recent_changes: Array<{
    id: string;
    item_name: string;
    old_status: string | null;
    new_status: string;
    new_location: string | null;
    changed_by_name: string | null;
    changed_at: string;
  }>;
}

export interface InventoryAlert {
  id: string;
  user_id: string;
  item_id: string | null;
  item_name: string | null;
  alert_type: "low_activity" | "maintenance_due" | "status_change" | "custom";
  title: string;
  message: string | null;
  priority: "low" | "medium" | "high";
  is_read: boolean;
  is_emailed: boolean;
  due_date: string | null;
  created_at: string;
}

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
   * Get inventory analytics dashboard data
   * GET /api/inventory/analytics
   */
  getAnalytics: async (period?: string): Promise<ApiResponse<InventoryAnalytics>> => {
    return get("/inventory/analytics", { period });
  },

  /**
   * Export analytics as CSV
   * GET /api/inventory/analytics/export
   */
  exportAnalyticsCsv: (period?: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || "https://qr.ieosuia.com/api";
    const token = localStorage.getItem("auth_token");
    return `${baseUrl}/inventory/analytics/export?period=${period || "30d"}&token=${token}`;
  },

  /**
   * Get user's inventory alerts
   * GET /api/inventory/alerts
   */
  getAlerts: async (): Promise<ApiResponse<{ alerts: InventoryAlert[]; unread_count: number }>> => {
    return get("/inventory/alerts");
  },

  /**
   * Mark alerts as read
   * POST /api/inventory/alerts/read
   */
  markAlertsRead: async (alertIds?: string[]): Promise<ApiResponse<null>> => {
    return post("/inventory/alerts/read", { alert_ids: alertIds });
  },

  /**
   * Check and create low-activity alerts
   * POST /api/inventory/alerts/check
   */
  checkAlerts: async (): Promise<ApiResponse<{ alerts_created: number; emails_sent: number }>> => {
    return post("/inventory/alerts/check");
  },

  /**
   * Set maintenance reminder for an item
   * POST /api/inventory/maintenance
   */
  setMaintenanceReminder: async (data: {
    item_id: string;
    due_date: string;
    message?: string;
    priority?: "low" | "medium" | "high";
  }): Promise<ApiResponse<null>> => {
    return post("/inventory/maintenance", data);
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
