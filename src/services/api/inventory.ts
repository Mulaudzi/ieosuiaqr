import apiClient, { del, get, post, put } from "./client";
import { ApiResponse, PaginatedResponse } from "./types";

export type InventoryStatus = "in_stock" | "available" | "low_stock" | "out_of_stock" | "checked_out" | "maintenance" | "damaged" | "lost" | "missing" | "unavailable" | "out";
export type InventoryType = "quantity" | "serialized";
export type InventoryAction = "add_stock" | "remove_stock" | "checkout" | "return" | "transfer" | "damaged" | "lost" | "missing" | "maintenance_send" | "maintenance_release" | "adjust" | "reconciliation";

export interface InventoryAnalytics {
  summary: {
    total_items: number;
    total_scans: number;
    items_with_qr: number;
    items_without_qr: number;
    quantity_products: number;
    serialized_items: number;
    units_in_stock: number;
    low_stock_products: number;
    out_of_stock_products: number;
    checked_out_items: number;
    maintenance_items: number;
    damaged_items: number;
    lost_items: number;
    movement_total: number;
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
  movements_by_action: Array<{ action_type: string; movement_count: number; units_moved: number }>;
  movements_by_location: Array<{ location: string; movement_count: number; units_moved: number }>;
  period: { key: string; days: number; generated_at: string };
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
  inventory_type: InventoryType;
  inventory_identifier: string | null;
  quantity: number;
  minimum_stock_level: number;
  assigned_to: string | null;
  notes: string | null;
  status: InventoryStatus;
  location: string | null;
  last_scan_date: string | null;
  qr_preview?: string;
  created_at: string;
  updated_at: string;
  shared_access?: string[]; // User IDs with access
  access_role?: "owner" | "viewer" | "operator" | "controller" | "admin";
  capabilities?: { operate: boolean; control: boolean; administer: boolean };
  stock_levels?: Array<{ location_name: string; quantity: number }>;
}

export interface CreateInventoryRequest {
  qr_id?: string;
  name: string;
  category: string;
  notes?: string;
  status?: InventoryStatus;
  location?: string;
  inventory_type?: InventoryType;
  inventory_identifier?: string;
  quantity?: number;
  minimum_stock_level?: number;
}

export interface UpdateInventoryRequest {
  qr_id?: string | null;
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
    location?: string;
    assigned_to?: string;
    inventory_type?: InventoryType;
    low_stock?: number;
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
  createWithQr: async (data: CreateInventoryRequest & { idempotency_key: string }): Promise<ApiResponse<{ item: InventoryItem; qr_id: number; scan_url: string; duplicate: boolean }>> => post('/inventory/with-qr',data),

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
  exportAnalyticsCsv: async (period?: string): Promise<Blob> => {
    const response = await apiClient.get("/inventory/analytics/export", {
      params: { period: period || "30d" },
      responseType: "blob",
    });
    return response.data;
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

  performAction: async (id: string, action: InventoryAction, data: Record<string, unknown>): Promise<ApiResponse<{ item: InventoryItem; movement_id: number; duplicate: boolean }>> =>
    post(`/inventory/${id}/actions/${action}`, data),
  movements: async (id: string, params?: Record<string, unknown>): Promise<ApiResponse<InventoryMovement[]>> =>
    get(`/inventory/${id}/movements`, params),
  exportMovements: async (id: string, params?: Record<string, unknown>): Promise<Blob> => {
    const response = await apiClient.get(`/inventory/${id}/movements/export`, { params, responseType: "blob" });
    return response.data;
  },
  saveStockCount: async (id: string, data: Record<string, unknown>): Promise<ApiResponse<StockCount>> =>
    post(`/inventory/${id}/stock-counts`, data),
  applyStockCount: async (id: string, countId: number, reason?: string): Promise<ApiResponse<{ item: InventoryItem }>> =>
    post(`/inventory/${id}/stock-counts/${countId}/apply`, { reason }),
  locations: async (itemId?: string): Promise<ApiResponse<Array<{ id: string; name: string; code: string | null }>>> => get('/inventory/locations',itemId?{item_id:itemId}:undefined),
  createLocation: async (name: string): Promise<ApiResponse<{ id: number; name: string }>> => post('/inventory/locations',{name}),
};

export interface InventoryMovement {
  id: string; action_type: string; quantity_delta: number; previous_quantity: number; new_quantity: number;
  previous_status: string; new_status: string; from_location: string | null; to_location: string | null;
  reason: string; performed_by_name: string; related_party: string | null; occurred_at: string; notes: string | null;
}
export interface StockCount { id: number; expected_quantity: number; counted_quantity: number; difference: number; location: string; status: "saved" | "applied"; }
