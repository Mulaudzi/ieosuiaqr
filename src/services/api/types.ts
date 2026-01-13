// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// User & Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  email_verified_at: string | null;
  avatar_url: string | null;
  plan_id?: number;
  plan: Plan | string;
  created_at: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  captcha_token?: string | null;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  captcha_token?: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
  // Notification preferences
  notify_status_change?: boolean;
  notify_low_activity?: boolean;
  notify_maintenance?: boolean;
  low_activity_days?: number;
}

// Plan & Subscription Types
export interface Plan {
  id: number;
  name: "free" | "pro" | "enterprise";
  display_name: string;
  price_monthly_zar: number;
  price_annual_zar: number;
  qr_limit: number | null; // null = unlimited
  features: string[];
  has_tracking: boolean;
  has_advanced_analytics: boolean;
  has_premium_types: boolean;
  has_custom_branding: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: number;
  plan: Plan;
  status: "active" | "trial" | "cancelled" | "past_due";
  billing_cycle: "monthly" | "annual";
  renewal_date: string;
  payfast_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckoutRequest {
  plan_id: number;
  billing_cycle: "monthly" | "annual";
}

export interface CheckoutResponse {
  payment_url: string;
  payment_id: string;
}

// Invoice Types
export interface Invoice {
  id: string;
  user_id: string;
  subscription_id: string;
  invoice_number: string;
  amount_zar: number;
  status: "paid" | "pending" | "failed" | "refunded";
  description: string;
  invoice_date: string;
  pdf_url: string | null;
  created_at: string;
}

// QR Code Types
export type QRType = "url" | "text" | "email" | "phone" | "sms" | "wifi" | "vcard" | "event" | "location";

export interface QRCodeBase {
  id: string;
  user_id: string;
  type: QRType;
  name: string;
  is_dynamic: boolean;
  dynamic_id: string | null;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

export interface QRCodeContent {
  // URL
  url?: string;
  
  // Text
  text?: string;
  
  // Email
  email?: string;
  subject?: string;
  body?: string;
  
  // Phone/SMS
  phone?: string;
  message?: string;
  
  // WiFi
  ssid?: string;
  password?: string;
  encryption?: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
  
  // vCard
  firstName?: string;
  lastName?: string;
  organization?: string;
  title?: string;
  phoneWork?: string;
  phoneMobile?: string;
  emailWork?: string;
  website?: string;
  address?: string;
  
  // Event
  eventTitle?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  
  // Location
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface QRCodeCustomization {
  foreground_color: string;
  background_color: string;
  logo_url: string | null;
  corner_radius: number;
  error_correction: "L" | "M" | "Q" | "H";
}

export interface QRCode extends QRCodeBase {
  content: QRCodeContent;
  customization: QRCodeCustomization;
  image_url: string;
}

export interface CreateQRCodeRequest {
  type: QRType;
  name: string;
  content: QRCodeContent | Record<string, string>;
  customization?: Partial<QRCodeCustomization>;
  custom_options?: {
    fgColor?: string;
    bgColor?: string;
    logo_path?: string;
  };
  is_dynamic?: boolean;
}

export interface UpdateQRCodeRequest {
  name?: string;
  content?: Partial<QRCodeContent>;
  customization?: Partial<QRCodeCustomization>;
}

export interface BulkCreateQRCodeRequest {
  qr_codes: CreateQRCodeRequest[];
}

// Scan & Analytics Types
export interface ScanLog {
  id: string;
  qr_id: string;
  ip_hash: string;
  device_type: "mobile" | "tablet" | "desktop" | "unknown";
  browser: string;
  os: string;
  user_agent: string;
  location: ScanLocation | null;
  timestamp: string;
}

export interface ScanLocation {
  city: string | null;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
}

export interface ScanFilters {
  start_date?: string;
  end_date?: string;
  device_type?: string;
  country?: string;
}

export interface AnalyticsSummary {
  total_scans: number;
  unique_scans: number;
  scan_change_percent: number;
  top_device: string;
  device_breakdown: DeviceBreakdown[];
  country_breakdown: CountryBreakdown[];
  hourly_distribution: HourlyDistribution[];
  daily_trend: DailyTrend[];
}

export interface DeviceBreakdown {
  device_type: string;
  count: number;
  percentage: number;
}

export interface CountryBreakdown {
  country: string;
  country_code: string;
  count: number;
  percentage: number;
}

export interface HourlyDistribution {
  hour: number;
  count: number;
}

export interface DailyTrend {
  date: string;
  count: number;
}

// Report Types
export interface ReportRequest {
  type: "scans" | "qr_codes" | "analytics";
  format: "csv" | "pdf";
  start_date?: string;
  end_date?: string;
  qr_ids?: string[];
}

export interface ReportResponse {
  download_url: string;
  expires_at: string;
}

// Notification Preferences
export interface NotificationPreferences {
  email_notifications: boolean;
  scan_alerts: boolean;
  scan_alert_threshold: number;
  weekly_report: boolean;
  marketing_emails: boolean;
}
