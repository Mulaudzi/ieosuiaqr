import { get, post } from "./client";
import {
  ApiResponse,
  CheckoutRequest,
  CheckoutResponse,
  Invoice,
  PaginatedResponse,
  Plan,
  Subscription,
} from "./types";

export interface PaymentRecord {
  id: string;
  payment_id: string;
  amount_zar: number;
  status: "succeeded" | "failed" | "pending" | "refunded";
  payment_method: string;
  description: string;
  created_at: string;
}

export interface SubscriptionStatus {
  id?: number;
  plan: string;
  status: string;
  frequency?: string;
  qr_limit: number;
  features: string[];
  renewal_date: string | null;
  last_payment_date?: string;
  price?: number;
  is_synced: boolean;
}

export interface ProrationPreview {
  current_plan: string;
  new_plan: string;
  current_plan_price: number;
  new_plan_price: number;
  days_remaining: number;
  days_in_cycle: number;
  credit_remaining: number;
  amount_due: number;
  effective_date: string;
  is_upgrade: boolean;
}

// Billing & Subscription endpoints - ready for Laravel + PayFast backend
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
   * Get real-time subscription status
   * GET /api/subscriptions/status
   */
  getSubscriptionStatus: async (): Promise<ApiResponse<SubscriptionStatus>> => {
    return get("/subscriptions/status");
  },

  /**
   * Sync subscription from payment provider
   * POST /api/subscriptions/sync
   */
  syncSubscription: async (): Promise<ApiResponse<{ synced: boolean; plan: string }>> => {
    return post("/subscriptions/sync");
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
   * POST /api/subscription/resume
   */
  resumeSubscription: async (): Promise<ApiResponse<Subscription>> => {
    return post("/subscription/resume");
  },

  /**
   * Get proration preview for plan change
   * POST /api/subscriptions/proration-preview
   */
  getProrationPreview: async (data: CheckoutRequest): Promise<ApiResponse<ProrationPreview>> => {
    return post("/subscriptions/proration-preview", data);
  },

  /**
   * Change subscription plan with proration
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
   * Get payment history (all payment attempts)
   * GET /api/billing/payments
   */
  getPaymentHistory: async (params?: {
    page?: number;
    per_page?: number;
  }): Promise<ApiResponse<PaymentRecord[]>> => {
    return get("/billing/payments", params);
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
