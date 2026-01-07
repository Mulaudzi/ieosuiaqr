import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { ApiError } from "./types";

// Base URL for API - update this for production
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || "An unexpected error occurred",
      errors: error.response?.data?.errors,
      status: error.response?.status || 500,
    };

    // Handle specific status codes
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/signup")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(apiError);
  }
);

// Helper function for making requests
export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>(config);
  return response.data;
}

// GET request helper
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return apiRequest<T>({ method: "GET", url, params });
}

// POST request helper
export async function post<T>(url: string, data?: unknown): Promise<T> {
  return apiRequest<T>({ method: "POST", url, data });
}

// PUT request helper
export async function put<T>(url: string, data?: unknown): Promise<T> {
  return apiRequest<T>({ method: "PUT", url, data });
}

// PATCH request helper
export async function patch<T>(url: string, data?: unknown): Promise<T> {
  return apiRequest<T>({ method: "PATCH", url, data });
}

// DELETE request helper
export async function del<T>(url: string): Promise<T> {
  return apiRequest<T>({ method: "DELETE", url });
}

// Multipart form data helper (for file uploads)
export async function uploadFile<T>(url: string, formData: FormData): Promise<T> {
  return apiRequest<T>({
    method: "POST",
    url,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export default apiClient;
