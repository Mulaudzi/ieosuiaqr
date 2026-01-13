import { post, get, put } from "./client";
import { ApiResponse } from "./types";

export interface AdminUser {
  id: number;
  email: string;
  name: string;
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

export const adminApi = {
  /**
   * Admin login step 1 - verify email and first password
   */
  loginStep1: async (email: string, password: string): Promise<ApiResponse<AdminLoginStep1Response>> => {
    return post("/admin/auth/step1", { email, password });
  },

  /**
   * Admin login step 2 - verify second password
   */
  loginStep2: async (stepToken: string, password: string): Promise<ApiResponse<AdminLoginStep1Response>> => {
    return post("/admin/auth/step2", { step_token: stepToken, password });
  },

  /**
   * Admin login step 3 - verify third password and get session token
   */
  loginStep3: async (stepToken: string, password: string): Promise<ApiResponse<AdminLoginStep3Response>> => {
    return post("/admin/auth/step3", { step_token: stepToken, password });
  },

  /**
   * Check admin session validity
   */
  checkSession: async (): Promise<ApiResponse<AdminSessionResponse>> => {
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      throw { status: 401, message: "No admin token" };
    }
    
    const baseUrl = import.meta.env.VITE_API_URL || "https://qr.ieosuia.com/api";
    const response = await fetch(`${baseUrl}/admin/auth/session`, {
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      throw { status: response.status, message: "Session invalid" };
    }
    
    return response.json();
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
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      throw { status: 401, message: "No admin token" };
    }
    
    const baseUrl = import.meta.env.VITE_API_URL || "https://qr.ieosuia.com/api";
    const response = await fetch(`${baseUrl}/admin/auth/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw { status: response.status, message: result.message || "Failed to create admin" };
    }
    
    return result;
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
    const adminToken = localStorage.getItem("admin_token");
    if (!adminToken) {
      throw { status: 401, message: "No admin token" };
    }
    
    const baseUrl = import.meta.env.VITE_API_URL || "https://qr.ieosuia.com/api";
    const response = await fetch(`${baseUrl}/admin/auth/passwords`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw { status: response.status, message: result.message || "Failed to update passwords" };
    }
    
    return result;
  }
};
