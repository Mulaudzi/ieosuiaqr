import { ApiResponse, PaginatedResponse } from "./types";

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  last_login_at: string | null;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  admin_id: number | null;
  admin_email: string | null;
  action: string;
  category: string;
  target_type: string | null;
  target_id: number | null;
  target_name: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failure' | 'warning';
  created_at: string;
}

export interface AuditStats {
  by_category: Array<{ category: string; count: number }>;
  by_status: Array<{ status: string; count: number }>;
  recent_failures: AuditLog[];
  activity_by_day: Array<{ date: string; count: number }>;
  top_admins: Array<{ admin_email: string; count: number }>;
}

export interface AdminLoginStep1Response {
  step: number;
  step_token: string;
  message: string;
}

export interface AdminLoginStep3Response {
  step: number;
  admin_token: string;
  admin: AdminUser;
  message: string;
}

export interface AdminSessionResponse {
  valid: boolean;
  admin: AdminUser;
}

const getBaseUrl = () => import.meta.env.VITE_API_URL || "https://qr.ieosuia.com/api";

const getAuthHeaders = () => {
  const adminToken = localStorage.getItem("admin_token");
  return {
    "Authorization": `Bearer ${adminToken}`,
    "Content-Type": "application/json"
  };
};

const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const result = await response.json();
  if (!response.ok) {
    throw { status: response.status, message: result.message || "Request failed" };
  }
  return result;
};

export const adminApi = {
  /**
   * Admin login step 1 - verify email and first password
   */
  loginStep1: async (email: string, password: string): Promise<ApiResponse<AdminLoginStep1Response>> => {
    const response = await fetch(`${getBaseUrl()}/admin/auth/step1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(response);
  },

  /**
   * Admin login step 2 - verify second password
   */
  loginStep2: async (stepToken: string, password: string): Promise<ApiResponse<AdminLoginStep1Response>> => {
    const response = await fetch(`${getBaseUrl()}/admin/auth/step2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step_token: stepToken, password })
    });
    return handleResponse(response);
  },

  /**
   * Admin login step 3 - verify third password and get session token
   */
  loginStep3: async (stepToken: string, password: string): Promise<ApiResponse<AdminLoginStep3Response>> => {
    const response = await fetch(`${getBaseUrl()}/admin/auth/step3`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step_token: stepToken, password })
    });
    return handleResponse(response);
  },

  /**
   * Check admin session validity
   */
  checkSession: async (): Promise<ApiResponse<AdminSessionResponse>> => {
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      throw { status: 401, message: "No admin token" };
    }
    
    const response = await fetch(`${getBaseUrl()}/admin/auth/session`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * List all admin users
   */
  listAdmins: async (): Promise<ApiResponse<{ admins: AdminUser[] }>> => {
    const response = await fetch(`${getBaseUrl()}/admin/users`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Get single admin user
   */
  getAdmin: async (id: number): Promise<ApiResponse<AdminUser>> => {
    const response = await fetch(`${getBaseUrl()}/admin/users/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Update admin user
   */
  updateAdmin: async (id: number, data: {
    name?: string;
    email?: string;
    is_active?: boolean;
    password1?: string;
    password2?: string;
    password3?: string;
  }): Promise<ApiResponse<AdminUser>> => {
    const response = await fetch(`${getBaseUrl()}/admin/users/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  /**
   * Toggle admin active status
   */
  toggleAdminStatus: async (id: number): Promise<ApiResponse<{ id: number; is_active: boolean }>> => {
    const response = await fetch(`${getBaseUrl()}/admin/users/${id}/toggle`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Unlock admin account
   */
  unlockAdmin: async (id: number): Promise<ApiResponse<null>> => {
    const response = await fetch(`${getBaseUrl()}/admin/users/${id}/unlock`, {
      method: "POST",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Delete admin permanently
   */
  deleteAdmin: async (id: number): Promise<ApiResponse<null>> => {
    const response = await fetch(`${getBaseUrl()}/admin/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Create new admin user
   */
  createAdmin: async (data: {
    email: string;
    name: string;
    password1: string;
    password2: string;
    password3: string;
  }): Promise<ApiResponse<AdminUser>> => {
    const response = await fetch(`${getBaseUrl()}/admin/auth/create`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  /**
   * Update admin passwords
   */
  updatePasswords: async (data: {
    current_password: string;
    new_password1?: string;
    new_password2?: string;
    new_password3?: string;
  }): Promise<ApiResponse<null>> => {
    const response = await fetch(`${getBaseUrl()}/admin/auth/passwords`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // ===== Audit Log Methods =====

  /**
   * Get audit logs with pagination and filtering
   */
  getAuditLogs: async (params?: {
    page?: number;
    per_page?: number;
    category?: string;
    action?: string;
    admin_id?: number;
    status?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<PaginatedResponse<AuditLog>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await fetch(`${getBaseUrl()}/admin/audit?${searchParams}`, {
      headers: getAuthHeaders()
    });
    const result = await response.json();
    if (!response.ok) {
      throw { status: response.status, message: result.message || "Request failed" };
    }
    return result as PaginatedResponse<AuditLog>;
  },

  /**
   * Get audit statistics
   */
  getAuditStats: async (): Promise<ApiResponse<AuditStats>> => {
    const response = await fetch(`${getBaseUrl()}/admin/audit/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  /**
   * Get audit export URL
   */
  getAuditExportUrl: (fromDate?: string, toDate?: string): string => {
    const adminToken = localStorage.getItem("admin_token");
    const params = new URLSearchParams();
    if (fromDate) params.append("from_date", fromDate);
    if (toDate) params.append("to_date", toDate);
    params.append("token", adminToken || "");
    return `${getBaseUrl()}/admin/audit/export?${params}`;
  }
};
