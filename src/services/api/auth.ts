import { get, post, put } from "./client";
import {
  ApiResponse,
  AuthTokens,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
} from "./types";

// Get base URL for direct requests
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://qr.ieosuia.com/api";

// Auth endpoints - matching PHP backend routes
export const authApi = {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    return post("/auth/register", data);
  },

  /**
   * Login user
   * POST /api/auth/login
   */
  login: async (data: LoginRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    return post("/auth/login", data);
  },

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout: async (): Promise<ApiResponse<null>> => {
    return post("/auth/logout");
  },

  /**
   * Get current user profile
   * GET /api/user/profile
   */
  getProfile: async (): Promise<ApiResponse<User>> => {
    return get("/user/profile");
  },

  /**
   * Update user profile
   * PUT /api/user/profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<User>> => {
    return put("/user/profile", data);
  },

  /**
   * Upload avatar image
   * POST /api/user/avatar
   */
  uploadAvatar: async (file: Blob): Promise<ApiResponse<{ avatar_url: string }>> => {
    const formData = new FormData();
    formData.append("avatar", file, "avatar.jpg");

    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_BASE_URL}/user/avatar`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw { status: response.status, message: data.message || "Upload failed" };
    }

    return data;
  },

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse<null>> => {
    return post("/auth/forgot-password", data);
  },

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse<null>> => {
    return post("/auth/reset-password", data);
  },

  /**
   * Verify email with token
   * POST /api/auth/verify-email
   */
  verifyEmail: async (token: string): Promise<ApiResponse<null>> => {
    return post("/auth/verify-email", { token });
  },

  /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
  resendVerification: async (): Promise<ApiResponse<null>> => {
    return post("/auth/resend-verification");
  },

  /**
   * Refresh auth token
   * POST /api/auth/refresh-token
   */
  refreshToken: async (): Promise<ApiResponse<AuthTokens>> => {
    return post("/auth/refresh-token");
  },
};

// Helper functions for auth state management
export const authHelpers = {
  /**
   * Store auth tokens and user data
   */
  setAuth: (tokens: AuthTokens, user: User): void => {
    localStorage.setItem("auth_token", tokens.access_token);
    localStorage.setItem("user", JSON.stringify(user));
  },

  /**
   * Clear auth data
   */
  clearAuth: (): void => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  },

  /**
   * Get stored user
   */
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("auth_token");
  },

  /**
   * Get auth token
   */
  getToken: (): string | null => {
    return localStorage.getItem("auth_token");
  },
};
