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

// Auth endpoints - ready for Laravel backend
export const authApi = {
  /**
   * Register a new user
   * POST /api/v1/register
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    return post("/register", data);
  },

  /**
   * Login user
   * POST /api/v1/login
   */
  login: async (data: LoginRequest): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    return post("/login", data);
  },

  /**
   * Logout user
   * POST /api/v1/logout
   */
  logout: async (): Promise<ApiResponse<null>> => {
    return post("/logout");
  },

  /**
   * Get current user profile
   * GET /api/v1/user/profile
   */
  getProfile: async (): Promise<ApiResponse<User>> => {
    return get("/user/profile");
  },

  /**
   * Update user profile
   * PUT /api/v1/user/update
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<User>> => {
    return put("/user/update", data);
  },

  /**
   * Upload avatar image
   * POST /api/v1/user/avatar
   */
  uploadAvatar: async (file: Blob): Promise<ApiResponse<{ avatar_url: string }>> => {
    const formData = new FormData();
    formData.append("avatar", file, "avatar.jpg");

    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_BASE_URL}/v1/user/avatar`, {
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
   * POST /api/v1/forgot-password
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse<null>> => {
    return post("/forgot-password", data);
  },

  /**
   * Reset password with token
   * POST /api/v1/reset-password
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse<null>> => {
    return post("/reset-password", data);
  },

  /**
   * Verify email with token
   * POST /api/v1/verify-email
   */
  verifyEmail: async (token: string): Promise<ApiResponse<null>> => {
    return post("/verify-email", { token });
  },

  /**
   * Resend verification email
   * POST /api/v1/resend-verification
   */
  resendVerification: async (): Promise<ApiResponse<null>> => {
    return post("/resend-verification");
  },

  /**
   * Refresh auth token
   * POST /api/v1/refresh-token
   */
  refreshToken: async (): Promise<ApiResponse<AuthTokens>> => {
    return post("/refresh-token");
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
