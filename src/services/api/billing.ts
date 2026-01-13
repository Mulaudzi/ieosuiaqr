import { get, post } from "./client";
import {
  ApiResponse,
  CheckoutRequest,
  CheckoutResponse,
  Invoice,
  Plan,
  Subscription,
} from "./types";

// Billing & Subscription endpoints - PayFast backend
export const billingApi = {
  /**
   * Get all available plans
   * GET /api/subscriptions/plans
   */
  getPlans: async (): Promise<ApiResponse<Plan[]>> => {
    return get("/subscriptions/plans");
  },

  /**
   * Get current user's subscription
   * GET /api/subscriptions/current
   */
  getSubscription: async (): Promise<ApiResponse<Subscription | null>> => {
    return get("/subscriptions/current");
  },

  /**
   * Initiate PayFast checkout
   * POST /api/payments/checkout
   * Returns PayFast payment URL for redirect
   */
  checkout: async (data: CheckoutRequest): Promise<ApiResponse<CheckoutResponse>> => {
    return post("/payments/checkout", data);
  },

  /**
   * Cancel subscription
   * POST /api/subscriptions/cancel
   */
  cancelSubscription: async (): Promise<ApiResponse<{ cancelled_at: string }>> => {
    return post("/subscriptions/cancel");
  },

  /**
   * Resume cancelled subscription (before end of billing period)
   * POST /api/subscriptions/resume
   */
  resumeSubscription: async (): Promise<ApiResponse<Subscription>> => {
    return post("/subscriptions/resume");
  },

  /**
   * Change subscription plan
   * POST /api/subscriptions/change
   */
  changePlan: async (data: CheckoutRequest): Promise<ApiResponse<CheckoutResponse | Subscription>> => {
    return post("/subscriptions/change", data);
  },

  /**
   * Get invoice history
   * GET /api/billing/invoices
   */
  getInvoices: async (params?: {
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<Invoice[]>> => {
    return get("/billing/invoices", params);
  },

  /**
   * Get single invoice details
   * GET /api/billing/invoices/:id
   */
  getInvoice: async (id: string): Promise<ApiResponse<Invoice>> => {
    return get(`/billing/invoices/${id}`);
  },

  /**
   * Download invoice receipt PDF
   * GET /api/billing/invoices/:id/receipt
   */
  downloadReceipt: async (id: string): Promise<ApiResponse<{ download_url: string; filename: string }>> => {
    return get(`/billing/invoices/${id}/receipt`);
  },

  /**
   * Get upcoming invoice preview
   * GET /api/billing/upcoming
   */
  getUpcomingInvoice: async (): Promise<ApiResponse<{
    amount_zar: number;
    due_date: string;
    plan_name: string;
  } | null>> => {
    return get("/billing/upcoming");
  },

  /**
   * Get payment history
   * GET /api/billing/history
   */
  getPaymentHistory: async (params?: {
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<Array<{
    id: string;
    date: string;
    amount: number;
    currency: string;
    status: 'success' | 'failed' | 'pending';
    description: string;
  }>>> => {
    return get("/billing/history", params);
  },
};

// PayFast specific helpers
export const payfastHelpers = {
  /**
   * Generate PayFast redirect URL for checkout
   * In production, this is handled by the backend
   */
  getPaymentUrl: (checkoutResponse: CheckoutResponse): string => {
    return checkoutResponse.payment_url;
  },

  /**
   * Handle PayFast return/cancel URLs
   */
  handlePayFastReturn: (searchParams: URLSearchParams): {
    success: boolean;
    cancelled: boolean;
  } => {
    const success = searchParams.get("success") === "1";
    const cancelled = searchParams.get("cancelled") === "1";
    return { success, cancelled };
  },
};
