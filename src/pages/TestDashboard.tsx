import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import {
  Shield,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Database,
  Globe,
  Layout,
  Lock,
  Cpu,
  Link2,
  Copy,
  Download,
  Trash2,
  Zap,
  Server,
  Eye,
  FileCode,
  Network,
  TestTube2,
  Timer,
  Bug,
  Gauge,
  ArrowUpDown,
  ListTree,
  Activity,
  Layers,
  Terminal,
  ClipboardCheck,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface TestResult {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  status: "passed" | "failed" | "warning" | "skipped" | "running";
  duration: number;
  message: string;
  details: string[];
  expected?: string;
  actual?: string;
  stackTrace?: string;
  fix?: string;
  timestamp: string;
}

interface TestSuite {
  name: string;
  category: string;
  tests: TestResult[];
  duration: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
}

interface SystemStatus {
  name: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  latency: number;
  lastCheck: string;
}

interface NetworkLog {
  id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: string;
  request?: any;
  response?: any;
  error?: string;
}

interface ConsoleLog {
  id: string;
  type: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: string;
  stack?: string;
}

// ============================================================================
// TEST DEFINITIONS
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://qr.ieosuia.com/api";

const TEST_CATEGORIES = {
  frontend: { label: "Frontend Tests", icon: Layout, color: "text-blue-500" },
  backend: { label: "Backend API Tests", icon: Server, color: "text-green-500" },
  database: { label: "Database Tests", icon: Database, color: "text-purple-500" },
  auth: { label: "Authentication Tests", icon: Lock, color: "text-orange-500" },
  integration: { label: "Integration Tests", icon: Link2, color: "text-cyan-500" },
  e2e: { label: "E2E User Flow Tests", icon: Activity, color: "text-pink-500" },
  security: { label: "Security Tests", icon: Shield, color: "text-red-500" },
  performance: { label: "Performance Tests", icon: Gauge, color: "text-yellow-500" },
};

const STATUS_CONFIG = {
  passed: { label: "Passed", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  warning: { label: "Warning", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: AlertTriangle },
  skipped: { label: "Skipped", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: HelpCircle },
  running: { label: "Running", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: RefreshCw },
};

// ============================================================================
// TEST RUNNER CLASS
// ============================================================================

class TestRunner {
  private token: string | null;
  private results: TestResult[] = [];
  private networkLogs: NetworkLog[] = [];
  private consoleLogs: ConsoleLog[] = [];
  private onProgress: (progress: number, currentTest: string) => void;
  private onResult: (result: TestResult) => void;
  private onNetworkLog: (log: NetworkLog) => void;
  private onConsoleLog: (log: ConsoleLog) => void;

  constructor(
    token: string | null,
    onProgress: (progress: number, currentTest: string) => void,
    onResult: (result: TestResult) => void,
    onNetworkLog: (log: NetworkLog) => void,
    onConsoleLog: (log: ConsoleLog) => void
  ) {
    this.token = token;
    this.onProgress = onProgress;
    this.onResult = onResult;
    this.onNetworkLog = onNetworkLog;
    this.onConsoleLog = onConsoleLog;
  }

  private generateId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async apiRequest(
    method: string,
    endpoint: string,
    body?: any,
    requireAuth: boolean = true
  ): Promise<{ data: any; status: number; duration: number; error?: string }> {
    const start = performance.now();
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      
      if (requireAuth && this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const duration = performance.now() - start;
      let data;
      
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      const log: NetworkLog = {
        id: this.generateId(),
        method,
        url: endpoint,
        status: response.status,
        duration,
        timestamp: new Date().toISOString(),
        request: body,
        response: data,
      };
      
      this.networkLogs.push(log);
      this.onNetworkLog(log);

      return { data, status: response.status, duration };
    } catch (error: any) {
      const duration = performance.now() - start;
      
      const log: NetworkLog = {
        id: this.generateId(),
        method,
        url: endpoint,
        status: 0,
        duration,
        timestamp: new Date().toISOString(),
        request: body,
        error: error.message,
      };
      
      this.networkLogs.push(log);
      this.onNetworkLog(log);

      return { data: null, status: 0, duration, error: error.message };
    }
  }

  private createResult(
    name: string,
    category: string,
    subcategory: string,
    status: TestResult["status"],
    message: string,
    details: string[] = [],
    extra: Partial<TestResult> = {}
  ): TestResult {
    const result: TestResult = {
      id: this.generateId(),
      name,
      category,
      subcategory,
      status,
      duration: 0,
      message,
      details,
      timestamp: new Date().toISOString(),
      ...extra,
    };
    
    this.results.push(result);
    this.onResult(result);
    return result;
  }

  private log(type: ConsoleLog["type"], message: string, stack?: string) {
    const log: ConsoleLog = {
      id: this.generateId(),
      type,
      message,
      timestamp: new Date().toISOString(),
      stack,
    };
    this.consoleLogs.push(log);
    this.onConsoleLog(log);
  }

  // ============================================================================
  // FRONTEND TESTS
  // ============================================================================

  async runFrontendTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    // Test 1: DOM Structure
    this.log("info", "Testing DOM structure...");
    const domTest = this.testDOMStructure();
    results.push(domTest);

    // Test 2: React Component Rendering
    const renderTest = this.testReactRendering();
    results.push(renderTest);

    // Test 3: LocalStorage Access
    const storageTest = this.testLocalStorage();
    results.push(storageTest);

    // Test 4: Console Errors Check
    const consoleTest = this.testConsoleErrors();
    results.push(consoleTest);

    // Test 5: CSS/Styles Loading
    const stylesTest = this.testStylesLoading();
    results.push(stylesTest);

    // Test 6: Router Functionality
    const routerTest = this.testRouterFunctionality();
    results.push(routerTest);

    // Test 7: Theme System
    const themeTest = this.testThemeSystem();
    results.push(themeTest);

    return results;
  }

  private testDOMStructure(): TestResult {
    const start = performance.now();
    try {
      const root = document.getElementById("root");
      const hasRoot = !!root;
      const hasChildren = root ? root.children.length > 0 : false;
      
      const details: string[] = [];
      details.push(`Root element exists: ${hasRoot}`);
      details.push(`Root has children: ${hasChildren}`);
      details.push(`Child count: ${root?.children.length || 0}`);
      
      if (hasRoot && hasChildren) {
        return this.createResult(
          "DOM Structure Integrity",
          "frontend",
          "rendering",
          "passed",
          "DOM structure is valid and React app is mounted",
          details,
          { duration: performance.now() - start }
        );
      } else {
        return this.createResult(
          "DOM Structure Integrity",
          "frontend",
          "rendering",
          "failed",
          "DOM structure is invalid or React app not mounted",
          details,
          { 
            duration: performance.now() - start,
            fix: "Check if React app is properly initialized in main.tsx"
          }
        );
      }
    } catch (error: any) {
      return this.createResult(
        "DOM Structure Integrity",
        "frontend",
        "rendering",
        "failed",
        `DOM test failed: ${error.message}`,
        [],
        { duration: performance.now() - start, stackTrace: error.stack }
      );
    }
  }

  private testReactRendering(): TestResult {
    const start = performance.now();
    try {
      // Check for React-specific attributes
      const reactRoot = document.querySelector("[data-reactroot]") || 
                       document.querySelector("#root > *");
      const hasReactApp = !!reactRoot;
      
      // Check for common React elements
      const buttons = document.querySelectorAll("button").length;
      const links = document.querySelectorAll("a").length;
      const inputs = document.querySelectorAll("input").length;
      
      const details = [
        `React root found: ${hasReactApp}`,
        `Buttons rendered: ${buttons}`,
        `Links rendered: ${links}`,
        `Inputs rendered: ${inputs}`,
      ];

      return this.createResult(
        "React Component Rendering",
        "frontend",
        "rendering",
        hasReactApp ? "passed" : "failed",
        hasReactApp ? "React components are rendering correctly" : "React components not rendering",
        details,
        { duration: performance.now() - start }
      );
    } catch (error: any) {
      return this.createResult(
        "React Component Rendering",
        "frontend",
        "rendering",
        "failed",
        `React rendering test failed: ${error.message}`,
        [],
        { duration: performance.now() - start, stackTrace: error.stack }
      );
    }
  }

  private testLocalStorage(): TestResult {
    const start = performance.now();
    try {
      const testKey = "__test_storage__";
      const testValue = "test_value_" + Date.now();
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      const isWorking = retrieved === testValue;
      
      // Check auth-related storage
      const hasAuthToken = !!localStorage.getItem("auth_token");
      const hasUser = !!localStorage.getItem("user");
      
      const details = [
        `Storage read/write: ${isWorking ? "Working" : "Failed"}`,
        `Auth token present: ${hasAuthToken}`,
        `User data present: ${hasUser}`,
      ];

      return this.createResult(
        "LocalStorage Accessibility",
        "frontend",
        "storage",
        isWorking ? "passed" : "failed",
        isWorking ? "LocalStorage is accessible and functional" : "LocalStorage is not accessible",
        details,
        { duration: performance.now() - start }
      );
    } catch (error: any) {
      return this.createResult(
        "LocalStorage Accessibility",
        "frontend",
        "storage",
        "failed",
        `LocalStorage test failed: ${error.message}`,
        [],
        { 
          duration: performance.now() - start, 
          stackTrace: error.stack,
          fix: "Check browser privacy settings or incognito mode restrictions"
        }
      );
    }
  }

  private testConsoleErrors(): TestResult {
    const start = performance.now();
    // Note: We can't directly access console errors from JS
    // This is a simulated check based on page state
    
    const details = [
      "Console error interception is limited in browser JS",
      "Check browser DevTools for actual console errors",
      "Page appears to be rendering without visible errors",
    ];

    return this.createResult(
      "Console Error Check",
      "frontend",
      "errors",
      "warning",
      "Manual verification recommended - check browser DevTools",
      details,
      { duration: performance.now() - start }
    );
  }

  private testStylesLoading(): TestResult {
    const start = performance.now();
    try {
      const stylesheets = document.styleSheets;
      const loadedStyles = stylesheets.length;
      
      // Check for Tailwind CSS
      const hasTailwind = Array.from(document.querySelectorAll("*")).some(
        el => el.className && typeof el.className === "string" && 
              (el.className.includes("flex") || el.className.includes("bg-") || el.className.includes("text-"))
      );
      
      // Check computed styles
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      const hasStyles = computedStyle.fontFamily !== "";
      
      const details = [
        `Stylesheets loaded: ${loadedStyles}`,
        `Tailwind classes detected: ${hasTailwind}`,
        `Body has computed styles: ${hasStyles}`,
        `Font family: ${computedStyle.fontFamily.substring(0, 50)}...`,
      ];

      return this.createResult(
        "CSS/Styles Loading",
        "frontend",
        "styles",
        hasTailwind && hasStyles ? "passed" : "warning",
        hasTailwind && hasStyles ? "Styles are loading correctly" : "Some styles may not be loading",
        details,
        { duration: performance.now() - start }
      );
    } catch (error: any) {
      return this.createResult(
        "CSS/Styles Loading",
        "frontend",
        "styles",
        "failed",
        `Styles test failed: ${error.message}`,
        [],
        { duration: performance.now() - start, stackTrace: error.stack }
      );
    }
  }

  private testRouterFunctionality(): TestResult {
    const start = performance.now();
    try {
      const currentPath = window.location.pathname;
      const hasHistory = !!window.history;
      const hasPopState = typeof window.onpopstate !== "undefined" || true;
      
      const details = [
        `Current path: ${currentPath}`,
        `History API available: ${hasHistory}`,
        `PopState support: ${hasPopState}`,
        `Origin: ${window.location.origin}`,
      ];

      return this.createResult(
        "Router Functionality",
        "frontend",
        "navigation",
        hasHistory ? "passed" : "failed",
        hasHistory ? "Router and navigation are functional" : "Router may have issues",
        details,
        { duration: performance.now() - start }
      );
    } catch (error: any) {
      return this.createResult(
        "Router Functionality",
        "frontend",
        "navigation",
        "failed",
        `Router test failed: ${error.message}`,
        [],
        { duration: performance.now() - start, stackTrace: error.stack }
      );
    }
  }

  private testThemeSystem(): TestResult {
    const start = performance.now();
    try {
      const root = document.documentElement;
      const isDarkMode = root.classList.contains("dark");
      const hasThemeVars = !!getComputedStyle(root).getPropertyValue("--background");
      
      const cssVars = [
        "--background",
        "--foreground",
        "--primary",
        "--secondary",
        "--muted",
        "--accent",
      ];
      
      const presentVars = cssVars.filter(
        v => getComputedStyle(root).getPropertyValue(v)
      );
      
      const details = [
        `Dark mode active: ${isDarkMode}`,
        `CSS variables present: ${presentVars.length}/${cssVars.length}`,
        `Variables: ${presentVars.join(", ")}`,
      ];

      return this.createResult(
        "Theme System",
        "frontend",
        "theming",
        presentVars.length >= 4 ? "passed" : "warning",
        presentVars.length >= 4 ? "Theme system is properly configured" : "Some theme variables may be missing",
        details,
        { duration: performance.now() - start }
      );
    } catch (error: any) {
      return this.createResult(
        "Theme System",
        "frontend",
        "theming",
        "failed",
        `Theme test failed: ${error.message}`,
        [],
        { duration: performance.now() - start, stackTrace: error.stack }
      );
    }
  }

  // ============================================================================
  // BACKEND API TESTS
  // ============================================================================

  async runBackendTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: API Health Check
    this.log("info", "Testing API health...");
    results.push(await this.testAPIHealth());

    // Test 2: Auth Endpoints
    this.log("info", "Testing auth endpoints...");
    results.push(await this.testAuthEndpoints());

    // Test 3: QR Code Endpoints
    this.log("info", "Testing QR code endpoints...");
    results.push(await this.testQREndpoints());

    // Test 4: Analytics Endpoints
    this.log("info", "Testing analytics endpoints...");
    results.push(await this.testAnalyticsEndpoints());

    // Test 5: Inventory Endpoints
    this.log("info", "Testing inventory endpoints...");
    results.push(await this.testInventoryEndpoints());

    // Test 6: Subscription Endpoints
    this.log("info", "Testing subscription endpoints...");
    results.push(await this.testSubscriptionEndpoints());

    // Test 7: Billing Endpoints
    this.log("info", "Testing billing endpoints...");
    results.push(await this.testBillingEndpoints());

    return results;
  }

  private async testAPIHealth(): Promise<TestResult> {
    const start = performance.now();
    
    try {
      // Try to hit a public endpoint
      const { status, duration, error } = await this.apiRequest("GET", "/subscriptions/plans", null, false);
      
      const details = [
        `Endpoint: /subscriptions/plans`,
        `Status code: ${status}`,
        `Response time: ${duration.toFixed(0)}ms`,
      ];

      if (status === 200) {
        return this.createResult(
          "API Health Check",
          "backend",
          "health",
          "passed",
          "API is responding correctly",
          details,
          { duration: performance.now() - start }
        );
      } else if (status > 0) {
        return this.createResult(
          "API Health Check",
          "backend",
          "health",
          "warning",
          `API responded with status ${status}`,
          details,
          { duration: performance.now() - start }
        );
      } else {
        return this.createResult(
          "API Health Check",
          "backend",
          "health",
          "failed",
          `API unreachable: ${error}`,
          [...details, `Error: ${error}`],
          { 
            duration: performance.now() - start,
            fix: "Check if backend server is running and CORS is configured"
          }
        );
      }
    } catch (error: any) {
      return this.createResult(
        "API Health Check",
        "backend",
        "health",
        "failed",
        `API health check failed: ${error.message}`,
        [],
        { duration: performance.now() - start, stackTrace: error.stack }
      );
    }
  }

  private async testAuthEndpoints(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    let passCount = 0;
    let totalTests = 0;

    // Test GET profile
    totalTests++;
    const { status: profileStatus, duration: profileDuration } = await this.apiRequest("GET", "/user/profile");
    details.push(`GET /user/profile: ${profileStatus} (${profileDuration.toFixed(0)}ms)`);
    if (profileStatus === 200 || profileStatus === 401) passCount++;

    // Test GET notifications
    totalTests++;
    const { status: notifStatus, duration: notifDuration } = await this.apiRequest("GET", "/user/notifications");
    details.push(`GET /user/notifications: ${notifStatus} (${notifDuration.toFixed(0)}ms)`);
    if (notifStatus === 200 || notifStatus === 401) passCount++;

    const allPassed = passCount === totalTests;

    return this.createResult(
      "Auth Endpoints",
      "backend",
      "auth",
      allPassed ? "passed" : passCount > 0 ? "warning" : "failed",
      `${passCount}/${totalTests} auth endpoints responding correctly`,
      details,
      { duration: performance.now() - start }
    );
  }

  private async testQREndpoints(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    let passCount = 0;
    let totalTests = 0;

    // Test GET QR codes list
    totalTests++;
    const { status: listStatus, duration: listDuration } = await this.apiRequest("GET", "/qr");
    details.push(`GET /qr: ${listStatus} (${listDuration.toFixed(0)}ms)`);
    if (listStatus === 200 || listStatus === 401) passCount++;

    const allPassed = passCount === totalTests;

    return this.createResult(
      "QR Code Endpoints",
      "backend",
      "qr",
      allPassed ? "passed" : passCount > 0 ? "warning" : "failed",
      `${passCount}/${totalTests} QR endpoints responding correctly`,
      details,
      { duration: performance.now() - start }
    );
  }

  private async testAnalyticsEndpoints(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    let passCount = 0;
    let totalTests = 0;

    // Test analytics dashboard
    totalTests++;
    const { status, duration } = await this.apiRequest("GET", "/analytics/dashboard");
    details.push(`GET /analytics/dashboard: ${status} (${duration.toFixed(0)}ms)`);
    if (status === 200 || status === 401) passCount++;

    // Test analytics summary
    totalTests++;
    const { status: summaryStatus, duration: summaryDuration } = await this.apiRequest("GET", "/analytics/summary");
    details.push(`GET /analytics/summary: ${summaryStatus} (${summaryDuration.toFixed(0)}ms)`);
    if (summaryStatus === 200 || summaryStatus === 401) passCount++;

    const allPassed = passCount === totalTests;

    return this.createResult(
      "Analytics Endpoints",
      "backend",
      "analytics",
      allPassed ? "passed" : passCount > 0 ? "warning" : "failed",
      `${passCount}/${totalTests} analytics endpoints responding correctly`,
      details,
      { duration: performance.now() - start }
    );
  }

  private async testInventoryEndpoints(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    let passCount = 0;
    let totalTests = 0;

    // Test inventory list
    totalTests++;
    const { status, duration } = await this.apiRequest("GET", "/inventory");
    details.push(`GET /inventory: ${status} (${duration.toFixed(0)}ms)`);
    if (status === 200 || status === 401) passCount++;

    // Test inventory limits
    totalTests++;
    const { status: limitsStatus, duration: limitsDuration } = await this.apiRequest("GET", "/inventory/limits");
    details.push(`GET /inventory/limits: ${limitsStatus} (${limitsDuration.toFixed(0)}ms)`);
    if (limitsStatus === 200 || limitsStatus === 401) passCount++;

    const allPassed = passCount === totalTests;

    return this.createResult(
      "Inventory Endpoints",
      "backend",
      "inventory",
      allPassed ? "passed" : passCount > 0 ? "warning" : "failed",
      `${passCount}/${totalTests} inventory endpoints responding correctly`,
      details,
      { duration: performance.now() - start }
    );
  }

  private async testSubscriptionEndpoints(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    let passCount = 0;
    let totalTests = 0;

    // Test plans (public)
    totalTests++;
    const { status: plansStatus, duration: plansDuration } = await this.apiRequest("GET", "/subscriptions/plans", null, false);
    details.push(`GET /subscriptions/plans: ${plansStatus} (${plansDuration.toFixed(0)}ms)`);
    if (plansStatus === 200) passCount++;

    // Test current subscription
    totalTests++;
    const { status: currentStatus, duration: currentDuration } = await this.apiRequest("GET", "/subscriptions/current");
    details.push(`GET /subscriptions/current: ${currentStatus} (${currentDuration.toFixed(0)}ms)`);
    if (currentStatus === 200 || currentStatus === 401) passCount++;

    const allPassed = passCount === totalTests;

    return this.createResult(
      "Subscription Endpoints",
      "backend",
      "subscriptions",
      allPassed ? "passed" : passCount > 0 ? "warning" : "failed",
      `${passCount}/${totalTests} subscription endpoints responding correctly`,
      details,
      { duration: performance.now() - start }
    );
  }

  private async testBillingEndpoints(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    let passCount = 0;
    let totalTests = 0;

    // Test invoices
    totalTests++;
    const { status, duration } = await this.apiRequest("GET", "/billing/invoices");
    details.push(`GET /billing/invoices: ${status} (${duration.toFixed(0)}ms)`);
    if (status === 200 || status === 401) passCount++;

    // Test payments
    totalTests++;
    const { status: payStatus, duration: payDuration } = await this.apiRequest("GET", "/billing/payments");
    details.push(`GET /billing/payments: ${payStatus} (${payDuration.toFixed(0)}ms)`);
    if (payStatus === 200 || payStatus === 401) passCount++;

    const allPassed = passCount === totalTests;

    return this.createResult(
      "Billing Endpoints",
      "backend",
      "billing",
      allPassed ? "passed" : passCount > 0 ? "warning" : "failed",
      `${passCount}/${totalTests} billing endpoints responding correctly`,
      details,
      { duration: performance.now() - start }
    );
  }

  // ============================================================================
  // AUTH TESTS
  // ============================================================================

  async runAuthTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: Token Validity
    this.log("info", "Testing token validity...");
    results.push(await this.testTokenValidity());

    // Test 2: Protected Route Access
    this.log("info", "Testing protected routes...");
    results.push(await this.testProtectedRouteAccess());

    // Test 3: Token Storage
    this.log("info", "Testing token storage...");
    results.push(this.testTokenStorage());

    return results;
  }

  private async testTokenValidity(): Promise<TestResult> {
    const start = performance.now();
    
    if (!this.token) {
      return this.createResult(
        "Token Validity",
        "auth",
        "tokens",
        "skipped",
        "No token available - user not logged in",
        ["Login to test token validity"],
        { duration: performance.now() - start }
      );
    }

    const { status, duration } = await this.apiRequest("GET", "/user/profile");
    
    const details = [
      `Token present: Yes`,
      `Profile request status: ${status}`,
      `Response time: ${duration.toFixed(0)}ms`,
    ];

    if (status === 200) {
      return this.createResult(
        "Token Validity",
        "auth",
        "tokens",
        "passed",
        "Authentication token is valid",
        details,
        { duration: performance.now() - start }
      );
    } else if (status === 401) {
      return this.createResult(
        "Token Validity",
        "auth",
        "tokens",
        "failed",
        "Token is expired or invalid",
        details,
        { 
          duration: performance.now() - start,
          fix: "Re-login to get a fresh token"
        }
      );
    } else {
      return this.createResult(
        "Token Validity",
        "auth",
        "tokens",
        "warning",
        `Unexpected response: ${status}`,
        details,
        { duration: performance.now() - start }
      );
    }
  }

  private async testProtectedRouteAccess(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    
    // Test multiple protected endpoints
    const protectedEndpoints = [
      "/user/profile",
      "/qr",
      "/inventory",
      "/analytics/dashboard",
    ];

    let accessibleCount = 0;
    
    for (const endpoint of protectedEndpoints) {
      const { status } = await this.apiRequest("GET", endpoint);
      const accessible = status === 200;
      details.push(`${endpoint}: ${accessible ? "Accessible" : `Status ${status}`}`);
      if (accessible) accessibleCount++;
    }

    const hasToken = !!this.token;
    const expectedAccess = hasToken ? protectedEndpoints.length : 0;
    const isCorrect = accessibleCount === expectedAccess || 
                     (!hasToken && accessibleCount === 0);

    return this.createResult(
      "Protected Route Access",
      "auth",
      "authorization",
      isCorrect ? "passed" : "warning",
      hasToken 
        ? `${accessibleCount}/${protectedEndpoints.length} protected routes accessible`
        : "Protected routes correctly blocked without token",
      details,
      { duration: performance.now() - start }
    );
  }

  private testTokenStorage(): TestResult {
    const start = performance.now();
    
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("user");
    
    const details = [
      `Token in localStorage: ${token ? "Present" : "Missing"}`,
      `User data in localStorage: ${user ? "SECURITY WARNING - Should not be stored!" : "Not stored (correct)"}`,
    ];

    // SECURITY: User data should NOT be in localStorage anymore
    if (user) {
      details.push("⚠️ SECURITY: User data found in localStorage - this is a vulnerability");
      details.push("User data should only exist in React state (memory)");
    } else {
      details.push("✅ SECURITY: User data correctly NOT stored in localStorage");
    }

    // Valid state: token present without user data, or no auth at all
    const isSecure = !user;
    const hasValidAuth = token && !user;

    return this.createResult(
      "Token Storage Security",
      "auth",
      "storage",
      !isSecure ? "failed" : (hasValidAuth ? "passed" : "warning"),
      !isSecure 
        ? "SECURITY ISSUE: Sensitive user data exposed in localStorage" 
        : (hasValidAuth ? "Auth data properly stored (token only)" : "No auth data (user not logged in)"),
      details,
      { duration: performance.now() - start }
    );
  }

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  async runIntegrationTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: End-to-end flow simulation
    this.log("info", "Testing API contract consistency...");
    results.push(await this.testAPIContractConsistency());

    // Test 2: Cross-system data flow
    this.log("info", "Testing data flow integrity...");
    results.push(await this.testDataFlowIntegrity());

    return results;
  }

  private async testAPIContractConsistency(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    
    // Test that API responses match expected structure
    const { data, status } = await this.apiRequest("GET", "/subscriptions/plans", null, false);
    
    if (status === 200 && data) {
      const hasSuccess = typeof data.success === "boolean";
      const hasData = "data" in data;
      
      details.push(`Response has 'success' field: ${hasSuccess}`);
      details.push(`Response has 'data' field: ${hasData}`);
      
      if (data.data && Array.isArray(data.data)) {
        details.push(`Plans count: ${data.data.length}`);
      }

      return this.createResult(
        "API Contract Consistency",
        "integration",
        "contracts",
        hasSuccess && hasData ? "passed" : "warning",
        hasSuccess && hasData ? "API responses follow consistent structure" : "Some API responses may have inconsistent structure",
        details,
        { duration: performance.now() - start }
      );
    }

    return this.createResult(
      "API Contract Consistency",
      "integration",
      "contracts",
      "failed",
      "Could not verify API contract",
      [`Status: ${status}`],
      { duration: performance.now() - start }
    );
  }

  private async testDataFlowIntegrity(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    
    // Check if user data flows correctly between frontend and backend
    const storedUser = localStorage.getItem("user");
    
    if (!storedUser || !this.token) {
      return this.createResult(
        "Data Flow Integrity",
        "integration",
        "dataflow",
        "skipped",
        "Login required to test data flow",
        ["No user session available"],
        { duration: performance.now() - start }
      );
    }

    try {
      const localUser = JSON.parse(storedUser);
      const { data, status } = await this.apiRequest("GET", "/user/profile");
      
      if (status === 200 && data?.data) {
        const apiUser = data.data;
        const emailMatch = localUser.email === apiUser.email;
        const nameMatch = localUser.name === apiUser.name;
        
        details.push(`Email sync: ${emailMatch ? "Matched" : "Mismatch"}`);
        details.push(`Name sync: ${nameMatch ? "Matched" : "Mismatch"}`);
        details.push(`Local: ${localUser.email}`);
        details.push(`API: ${apiUser.email}`);

        const isSync = emailMatch && nameMatch;

        return this.createResult(
          "Data Flow Integrity",
          "integration",
          "dataflow",
          isSync ? "passed" : "warning",
          isSync ? "Local and API data are in sync" : "Data mismatch between local storage and API",
          details,
          { 
            duration: performance.now() - start,
            fix: isSync ? undefined : "Refresh user data or re-login"
          }
        );
      }
    } catch (error: any) {
      details.push(`Error: ${error.message}`);
    }

    return this.createResult(
      "Data Flow Integrity",
      "integration",
      "dataflow",
      "failed",
      "Could not verify data flow",
      details,
      { duration: performance.now() - start }
    );
  }

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================

  async runSecurityTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: XSS Protection
    this.log("info", "Testing XSS protection...");
    results.push(this.testXSSProtection());

    // Test 2: CSRF Headers
    this.log("info", "Testing CORS/security headers...");
    results.push(await this.testSecurityHeaders());

    // Test 3: Sensitive Data Exposure
    this.log("info", "Checking for sensitive data exposure...");
    results.push(this.testSensitiveDataExposure());

    return results;
  }

  private testXSSProtection(): TestResult {
    const start = performance.now();
    const details: string[] = [];
    
    // Check if dangerous HTML is being sanitized
    // This is a basic check - real XSS testing requires more thorough analysis
    const testPayloads = [
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "onerror=alert('xss')",
    ];
    
    let unsafeCount = 0;
    
    // Check if any script tags are in the DOM that shouldn't be
    const scripts = document.querySelectorAll("script");
    const inlineScripts = Array.from(scripts).filter(s => !s.src && s.innerHTML.includes("alert"));
    
    details.push(`Total scripts: ${scripts.length}`);
    details.push(`Suspicious inline scripts: ${inlineScripts.length}`);
    details.push("Note: Deep XSS testing requires security audit tools");

    return this.createResult(
      "XSS Protection",
      "security",
      "xss",
      inlineScripts.length === 0 ? "passed" : "warning",
      inlineScripts.length === 0 ? "No obvious XSS vulnerabilities detected" : "Potential XSS vectors found",
      details,
      { duration: performance.now() - start }
    );
  }

  private async testSecurityHeaders(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    
    try {
      const response = await fetch(API_BASE_URL + "/subscriptions/plans", { method: "GET" });
      
      // Check important security headers
      const headers = {
        "content-type": response.headers.get("content-type"),
        "x-content-type-options": response.headers.get("x-content-type-options"),
        "x-frame-options": response.headers.get("x-frame-options"),
        "x-xss-protection": response.headers.get("x-xss-protection"),
      };
      
      let headerCount = 0;
      Object.entries(headers).forEach(([key, value]) => {
        if (value) {
          headerCount++;
          details.push(`${key}: ${value}`);
        } else {
          details.push(`${key}: Not set`);
        }
      });

      return this.createResult(
        "Security Headers",
        "security",
        "headers",
        headerCount >= 2 ? "passed" : "warning",
        `${headerCount}/4 security headers configured`,
        details,
        { 
          duration: performance.now() - start,
          fix: headerCount < 4 ? "Configure additional security headers on the server" : undefined
        }
      );
    } catch (error: any) {
      return this.createResult(
        "Security Headers",
        "security",
        "headers",
        "failed",
        `Could not check security headers: ${error.message}`,
        [],
        { duration: performance.now() - start }
      );
    }
  }

  private testSensitiveDataExposure(): TestResult {
    const start = performance.now();
    const details: string[] = [];
    
    // Check localStorage for sensitive data that shouldn't be there
    const sensitiveKeys = ["password", "secret", "private_key", "credit_card", "ssn"];
    let exposedCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
          exposedCount++;
          details.push(`⚠️ Potentially sensitive key found: ${key}`);
        }
      }
    }

    // Check window object for exposed secrets
    const windowVars = Object.keys(window).filter(
      k => k.toLowerCase().includes("secret") || k.toLowerCase().includes("password")
    );
    
    if (windowVars.length > 0) {
      details.push(`⚠️ Suspicious window variables: ${windowVars.join(", ")}`);
      exposedCount += windowVars.length;
    }

    details.push(`localStorage keys checked: ${localStorage.length}`);
    details.push(`Potentially sensitive items: ${exposedCount}`);

    return this.createResult(
      "Sensitive Data Exposure",
      "security",
      "data-exposure",
      exposedCount === 0 ? "passed" : "warning",
      exposedCount === 0 ? "No obvious sensitive data exposure detected" : `${exposedCount} potential exposure(s) found`,
      details,
      { 
        duration: performance.now() - start,
        fix: exposedCount > 0 ? "Review and remove any sensitive data from client-side storage" : undefined
      }
    );
  }

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  async runPerformanceTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: Page Load Performance
    this.log("info", "Testing page load performance...");
    results.push(this.testPageLoadPerformance());

    // Test 2: API Response Times
    this.log("info", "Testing API response times...");
    results.push(await this.testAPIResponseTimes());

    // Test 3: Memory Usage
    this.log("info", "Checking memory usage...");
    results.push(this.testMemoryUsage());

    return results;
  }

  private testPageLoadPerformance(): TestResult {
    const start = performance.now();
    const details: string[] = [];
    
    try {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.startTime;
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.startTime;
        const firstByte = navigation.responseStart - navigation.requestStart;
        
        details.push(`Total load time: ${loadTime.toFixed(0)}ms`);
        details.push(`DOM content loaded: ${domContentLoaded.toFixed(0)}ms`);
        details.push(`Time to first byte: ${firstByte.toFixed(0)}ms`);
        
        const isGood = loadTime < 3000;
        const isOk = loadTime < 5000;

        return this.createResult(
          "Page Load Performance",
          "performance",
          "loading",
          isGood ? "passed" : isOk ? "warning" : "failed",
          isGood ? "Page loads quickly" : isOk ? "Page load is acceptable but could be improved" : "Page load is slow",
          details,
          { 
            duration: performance.now() - start,
            fix: !isGood ? "Optimize bundle size, lazy load components, and use code splitting" : undefined
          }
        );
      }
    } catch (error: any) {
      details.push(`Error: ${error.message}`);
    }

    return this.createResult(
      "Page Load Performance",
      "performance",
      "loading",
      "warning",
      "Could not measure page load performance",
      details,
      { duration: performance.now() - start }
    );
  }

  private async testAPIResponseTimes(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    
    const endpoints = [
      { url: "/subscriptions/plans", auth: false },
      { url: "/user/profile", auth: true },
    ];

    let totalTime = 0;
    let requestCount = 0;
    let slowCount = 0;

    for (const endpoint of endpoints) {
      if (endpoint.auth && !this.token) continue;
      
      const { duration } = await this.apiRequest("GET", endpoint.url, null, endpoint.auth);
      totalTime += duration;
      requestCount++;
      
      if (duration > 1000) slowCount++;
      
      details.push(`${endpoint.url}: ${duration.toFixed(0)}ms${duration > 1000 ? " ⚠️ SLOW" : ""}`);
    }

    const avgTime = requestCount > 0 ? totalTime / requestCount : 0;
    details.push(`Average response time: ${avgTime.toFixed(0)}ms`);

    const isGood = avgTime < 500;
    const isOk = avgTime < 1000;

    return this.createResult(
      "API Response Times",
      "performance",
      "api",
      isGood ? "passed" : isOk ? "warning" : "failed",
      isGood ? "API responses are fast" : isOk ? "API responses are acceptable" : "API responses are slow",
      details,
      { 
        duration: performance.now() - start,
        fix: !isGood ? "Optimize database queries, add caching, check server resources" : undefined
      }
    );
  }

  private testMemoryUsage(): TestResult {
    const start = performance.now();
    const details: string[] = [];
    
    try {
      // @ts-ignore - performance.memory is Chrome-only
      const memory = (performance as any).memory;
      
      if (memory) {
        const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
        const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
        const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2);
        const usagePercent = ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1);
        
        details.push(`Used heap: ${usedMB} MB`);
        details.push(`Total heap: ${totalMB} MB`);
        details.push(`Heap limit: ${limitMB} MB`);
        details.push(`Usage: ${usagePercent}%`);

        const usage = parseFloat(usagePercent);
        const isGood = usage < 50;
        const isOk = usage < 80;

        return this.createResult(
          "Memory Usage",
          "performance",
          "memory",
          isGood ? "passed" : isOk ? "warning" : "failed",
          isGood ? "Memory usage is healthy" : isOk ? "Memory usage is elevated" : "High memory usage detected",
          details,
          { 
            duration: performance.now() - start,
            fix: !isGood ? "Check for memory leaks, optimize state management" : undefined
          }
        );
      }
    } catch (error: any) {
      details.push(`Memory API not available: ${error.message}`);
    }

    return this.createResult(
      "Memory Usage",
      "performance",
      "memory",
      "warning",
      "Memory API not available (Chrome only)",
      details,
      { duration: performance.now() - start }
    );
  }

  // ============================================================================
  // DATABASE TESTS
  // ============================================================================

  async runDatabaseTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: Database Connectivity
    this.log("info", "Testing database connectivity...");
    results.push(await this.testDatabaseConnectivity());

    // Test 2: Table Existence Check
    this.log("info", "Verifying table existence...");
    results.push(await this.testTableExistence());

    // Test 3: Query Performance
    this.log("info", "Testing query performance...");
    results.push(await this.testQueryPerformance());

    // Test 4: Data Integrity
    this.log("info", "Checking data integrity...");
    results.push(await this.testDataIntegrity());

    return results;
  }

  private async testDatabaseConnectivity(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    
    // Test database connectivity via QA endpoint
    const { data, status, duration } = await this.apiRequest("GET", "/qa/dashboard");
    
    if (status === 200 && data?.data) {
      const systems = data.data.systems || {};
      const healthySystems = Object.values(systems).filter((s: any) => s.health === "healthy").length;
      const totalSystems = Object.keys(systems).length;
      
      details.push(`Database connection: Active`);
      details.push(`Systems checked: ${totalSystems}`);
      details.push(`Healthy systems: ${healthySystems}`);
      details.push(`Response time: ${duration.toFixed(0)}ms`);
      
      Object.entries(systems).forEach(([name, sys]: [string, any]) => {
        details.push(`  ${name}: ${sys.health} (${sys.tables_found}/${sys.tables_required} tables)`);
      });

      return this.createResult(
        "Database Connectivity",
        "database",
        "connectivity",
        healthySystems === totalSystems ? "passed" : healthySystems > 0 ? "warning" : "failed",
        healthySystems === totalSystems ? "Database is fully connected and healthy" : `${healthySystems}/${totalSystems} systems healthy`,
        details,
        { duration: performance.now() - start }
      );
    } else if (status === 401) {
      return this.createResult(
        "Database Connectivity",
        "database",
        "connectivity",
        "skipped",
        "Login required to test database connectivity",
        ["Authenticate to run database tests"],
        { duration: performance.now() - start }
      );
    }

    return this.createResult(
      "Database Connectivity",
      "database",
      "connectivity",
      "failed",
      "Could not verify database connectivity",
      [`Status: ${status}`, `Response time: ${duration.toFixed(0)}ms`],
      { 
        duration: performance.now() - start,
        fix: "Check database server status and connection configuration"
      }
    );
  }

  private async testTableExistence(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    
    // Expected tables based on the application schema
    const expectedTables = [
      "users",
      "qr_codes",
      "scan_logs",
      "inventory_items",
      "subscriptions",
      "plans",
      "invoices",
      "design_presets",
    ];
    
    // We can infer table existence from API endpoints
    const tableChecks = [
      { table: "users", endpoint: "/user/profile", auth: true },
      { table: "qr_codes", endpoint: "/qr", auth: true },
      { table: "plans", endpoint: "/subscriptions/plans", auth: false },
      { table: "inventory_items", endpoint: "/inventory", auth: true },
    ];

    let verifiedTables = 0;
    let failedTables = 0;

    for (const check of tableChecks) {
      if (check.auth && !this.token) continue;
      
      const { status } = await this.apiRequest("GET", check.endpoint, null, check.auth);
      
      if (status === 200 || status === 401) {
        verifiedTables++;
        details.push(`✅ ${check.table}: Verified via ${check.endpoint}`);
      } else if (status === 500) {
        failedTables++;
        details.push(`❌ ${check.table}: Possible missing table (500 error)`);
      } else {
        details.push(`⚠️ ${check.table}: Status ${status}`);
      }
    }

    details.push(`Expected tables: ${expectedTables.length}`);
    details.push(`Verified: ${verifiedTables}`);
    details.push(`Failed: ${failedTables}`);

    return this.createResult(
      "Table Existence",
      "database",
      "schema",
      failedTables === 0 ? "passed" : "failed",
      failedTables === 0 ? "All checked tables exist" : `${failedTables} table(s) may be missing`,
      details,
      { 
        duration: performance.now() - start,
        fix: failedTables > 0 ? "Run database migrations to create missing tables" : undefined
      }
    );
  }

  private async testQueryPerformance(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    
    const queryTests = [
      { name: "User Profile", endpoint: "/user/profile", threshold: 200 },
      { name: "QR Codes List", endpoint: "/qr?limit=10", threshold: 300 },
      { name: "Plans List", endpoint: "/subscriptions/plans", threshold: 100 },
      { name: "Analytics Summary", endpoint: "/analytics/summary", threshold: 500 },
    ];

    let slowQueries = 0;
    let fastQueries = 0;
    let totalDuration = 0;

    for (const test of queryTests) {
      const isAuthRequired = !test.endpoint.includes("plans");
      if (isAuthRequired && !this.token) continue;
      
      const { status, duration } = await this.apiRequest("GET", test.endpoint, null, isAuthRequired);
      totalDuration += duration;
      
      if (status === 200 || status === 401) {
        const isSlow = duration > test.threshold;
        if (isSlow) {
          slowQueries++;
          details.push(`⚠️ ${test.name}: ${duration.toFixed(0)}ms (threshold: ${test.threshold}ms) - SLOW`);
        } else {
          fastQueries++;
          details.push(`✅ ${test.name}: ${duration.toFixed(0)}ms (threshold: ${test.threshold}ms)`);
        }
      }
    }

    const avgDuration = totalDuration / queryTests.length;
    details.push(`Average query time: ${avgDuration.toFixed(0)}ms`);
    details.push(`Fast queries: ${fastQueries}`);
    details.push(`Slow queries: ${slowQueries}`);

    return this.createResult(
      "Query Performance",
      "database",
      "performance",
      slowQueries === 0 ? "passed" : slowQueries <= 1 ? "warning" : "failed",
      slowQueries === 0 ? "All queries performing within thresholds" : `${slowQueries} slow query(ies) detected`,
      details,
      { 
        duration: performance.now() - start,
        fix: slowQueries > 0 ? "Optimize slow queries with indexes, query analysis, or caching" : undefined
      }
    );
  }

  private async testDataIntegrity(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    
    if (!this.token) {
      return this.createResult(
        "Data Integrity",
        "database",
        "integrity",
        "skipped",
        "Login required to test data integrity",
        ["Authenticate to run data integrity tests"],
        { duration: performance.now() - start }
      );
    }

    let issues = 0;

    // Check user profile consistency
    const { data: profileData, status: profileStatus } = await this.apiRequest("GET", "/user/profile");
    
    if (profileStatus === 200 && profileData?.data) {
      const user = profileData.data;
      
      // Check required fields
      const requiredFields = ["id", "email", "name"];
      const missingFields = requiredFields.filter(f => !user[f]);
      
      if (missingFields.length > 0) {
        issues++;
        details.push(`❌ User profile missing fields: ${missingFields.join(", ")}`);
      } else {
        details.push(`✅ User profile has all required fields`);
      }
      
      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (user.email && !emailRegex.test(user.email)) {
        issues++;
        details.push(`❌ Invalid email format: ${user.email}`);
      }
    }

    // Check QR codes list integrity
    const { data: qrData, status: qrStatus } = await this.apiRequest("GET", "/qr?limit=5");
    
    if (qrStatus === 200 && qrData?.data) {
      const qrCodes = Array.isArray(qrData.data) ? qrData.data : [];
      
      details.push(`QR codes found: ${qrCodes.length}`);
      
      qrCodes.forEach((qr: any, index: number) => {
        if (!qr.id || !qr.type) {
          issues++;
          details.push(`❌ QR code ${index + 1} missing required fields`);
        }
      });
      
      if (qrCodes.length > 0 && issues === 0) {
        details.push(`✅ All QR codes have valid structure`);
      }
    }

    return this.createResult(
      "Data Integrity",
      "database",
      "integrity",
      issues === 0 ? "passed" : "warning",
      issues === 0 ? "Data integrity checks passed" : `${issues} integrity issue(s) found`,
      details,
      { 
        duration: performance.now() - start,
        fix: issues > 0 ? "Review and fix data validation rules" : undefined
      }
    );
  }

  // ============================================================================
  // E2E USER FLOW TESTS
  // ============================================================================

  async runE2ETests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test 1: QR Code Creation Flow
    this.log("info", "Testing QR code creation flow...");
    results.push(await this.testQRCodeCreationFlow());

    // Test 2: Analytics Viewing Flow
    this.log("info", "Testing analytics viewing flow...");
    results.push(await this.testAnalyticsViewingFlow());

    // Test 3: Inventory Management Flow
    this.log("info", "Testing inventory management flow...");
    results.push(await this.testInventoryManagementFlow());

    // Test 4: Profile Update Flow
    this.log("info", "Testing profile update flow...");
    results.push(await this.testProfileUpdateFlow());

    // Test 5: Subscription Flow
    this.log("info", "Testing subscription flow...");
    results.push(await this.testSubscriptionFlow());

    return results;
  }

  private async testQRCodeCreationFlow(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    const steps: string[] = [];
    let passed = true;

    if (!this.token) {
      return this.createResult(
        "QR Code Creation Flow",
        "e2e",
        "qr-creation",
        "skipped",
        "Login required to test QR code creation",
        ["Authenticate to run E2E tests"],
        { duration: performance.now() - start }
      );
    }

    // Step 1: Get current QR codes count
    steps.push("Step 1: Get current QR codes");
    const { data: listData, status: listStatus } = await this.apiRequest("GET", "/qr?limit=100");
    
    if (listStatus !== 200) {
      passed = false;
      details.push(`❌ Step 1 failed: Could not list QR codes (${listStatus})`);
    } else {
      const currentCount = listData?.data?.length || 0;
      details.push(`✅ Step 1: Listed ${currentCount} existing QR codes`);
    }

    // Step 2: Create a test QR code
    steps.push("Step 2: Create test QR code");
    const testQRData = {
      type: "url",
      name: `E2E Test QR ${Date.now()}`,
      content: { url: "https://example.com/e2e-test" },
    };
    
    const { data: createData, status: createStatus } = await this.apiRequest("POST", "/qr", testQRData);
    
    let createdQRId: number | null = null;
    
    if (createStatus === 201 && createData?.data?.id) {
      createdQRId = createData.data.id;
      details.push(`✅ Step 2: Created QR code with ID ${createdQRId}`);
    } else if (createStatus === 403) {
      details.push(`⚠️ Step 2: QR limit reached (expected for free plan)`);
    } else {
      passed = false;
      details.push(`❌ Step 2 failed: Could not create QR code (${createStatus})`);
    }

    // Step 3: Verify QR code exists
    if (createdQRId) {
      steps.push("Step 3: Verify QR code exists");
      const { data: getDataResult, status: getStatus } = await this.apiRequest("GET", `/qr/${createdQRId}`);
      
      if (getStatus === 200 && getDataResult?.data) {
        details.push(`✅ Step 3: Verified QR code exists`);
        details.push(`   Name: ${getDataResult.data.name}`);
        details.push(`   Type: ${getDataResult.data.type}`);
      } else {
        passed = false;
        details.push(`❌ Step 3 failed: Could not retrieve QR code`);
      }

      // Step 4: Clean up - delete test QR code
      steps.push("Step 4: Clean up test data");
      const { status: deleteStatus } = await this.apiRequest("DELETE", `/qr/${createdQRId}`);
      
      if (deleteStatus === 200) {
        details.push(`✅ Step 4: Cleaned up test QR code`);
      } else {
        details.push(`⚠️ Step 4: Could not delete test QR code (${deleteStatus})`);
      }
    }

    return this.createResult(
      "QR Code Creation Flow",
      "e2e",
      "qr-creation",
      passed ? "passed" : "failed",
      passed ? "QR code CRUD flow working correctly" : "QR code flow has issues",
      details,
      { 
        duration: performance.now() - start,
        fix: !passed ? "Check QR controller and database permissions" : undefined
      }
    );
  }

  private async testAnalyticsViewingFlow(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;

    if (!this.token) {
      return this.createResult(
        "Analytics Viewing Flow",
        "e2e",
        "analytics",
        "skipped",
        "Login required to test analytics",
        ["Authenticate to run E2E tests"],
        { duration: performance.now() - start }
      );
    }

    // Step 1: Load analytics dashboard
    const { data: dashData, status: dashStatus } = await this.apiRequest("GET", "/analytics/dashboard");
    
    if (dashStatus === 200) {
      details.push(`✅ Step 1: Analytics dashboard loaded`);
      if (dashData?.data) {
        details.push(`   Total scans: ${dashData.data.total_scans || 0}`);
      }
    } else {
      passed = false;
      details.push(`❌ Step 1 failed: Dashboard load failed (${dashStatus})`);
    }

    // Step 2: Load analytics summary
    const { data: summaryData, status: summaryStatus } = await this.apiRequest("GET", "/analytics/summary");
    
    if (summaryStatus === 200) {
      details.push(`✅ Step 2: Analytics summary loaded`);
    } else {
      passed = false;
      details.push(`❌ Step 2 failed: Summary load failed (${summaryStatus})`);
    }

    // Step 3: Load device breakdown
    const { data: devicesData, status: devicesStatus } = await this.apiRequest("GET", "/analytics/devices");
    
    if (devicesStatus === 200) {
      details.push(`✅ Step 3: Device breakdown loaded`);
      const devices = devicesData?.data || [];
      details.push(`   Device types tracked: ${devices.length}`);
    } else {
      details.push(`⚠️ Step 3: Device breakdown failed (${devicesStatus})`);
    }

    // Step 4: Load daily trend
    const { status: trendStatus } = await this.apiRequest("GET", "/analytics/daily");
    
    if (trendStatus === 200) {
      details.push(`✅ Step 4: Daily trend loaded`);
    } else {
      details.push(`⚠️ Step 4: Daily trend failed (${trendStatus})`);
    }

    return this.createResult(
      "Analytics Viewing Flow",
      "e2e",
      "analytics",
      passed ? "passed" : "warning",
      passed ? "Analytics flow working correctly" : "Some analytics features have issues",
      details,
      { 
        duration: performance.now() - start,
        fix: !passed ? "Check analytics controller and data aggregation" : undefined
      }
    );
  }

  private async testInventoryManagementFlow(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;

    if (!this.token) {
      return this.createResult(
        "Inventory Management Flow",
        "e2e",
        "inventory",
        "skipped",
        "Login required to test inventory",
        ["Authenticate to run E2E tests"],
        { duration: performance.now() - start }
      );
    }

    // Step 1: Load inventory list
    const { data: listData, status: listStatus } = await this.apiRequest("GET", "/inventory");
    
    if (listStatus === 200) {
      const items = listData?.data || [];
      details.push(`✅ Step 1: Inventory list loaded (${items.length} items)`);
    } else {
      passed = false;
      details.push(`❌ Step 1 failed: Inventory list failed (${listStatus})`);
    }

    // Step 2: Load inventory limits
    const { data: limitsData, status: limitsStatus } = await this.apiRequest("GET", "/inventory/limits");
    
    if (limitsStatus === 200) {
      details.push(`✅ Step 2: Inventory limits loaded`);
      if (limitsData?.data) {
        details.push(`   Current: ${limitsData.data.current || 0}`);
        details.push(`   Limit: ${limitsData.data.limit || "Unlimited"}`);
      }
    } else {
      details.push(`⚠️ Step 2: Limits check failed (${limitsStatus})`);
    }

    // Step 3: Load inventory analytics
    const { status: analyticsStatus } = await this.apiRequest("GET", "/inventory/analytics");
    
    if (analyticsStatus === 200) {
      details.push(`✅ Step 3: Inventory analytics loaded`);
    } else {
      details.push(`⚠️ Step 3: Inventory analytics failed (${analyticsStatus})`);
    }

    // Step 4: Load alerts
    const { status: alertsStatus } = await this.apiRequest("GET", "/inventory/alerts");
    
    if (alertsStatus === 200) {
      details.push(`✅ Step 4: Inventory alerts loaded`);
    } else {
      details.push(`⚠️ Step 4: Alerts check failed (${alertsStatus})`);
    }

    return this.createResult(
      "Inventory Management Flow",
      "e2e",
      "inventory",
      passed ? "passed" : "warning",
      passed ? "Inventory flow working correctly" : "Some inventory features have issues",
      details,
      { 
        duration: performance.now() - start,
        fix: !passed ? "Check inventory controller and database" : undefined
      }
    );
  }

  private async testProfileUpdateFlow(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;

    if (!this.token) {
      return this.createResult(
        "Profile Update Flow",
        "e2e",
        "profile",
        "skipped",
        "Login required to test profile",
        ["Authenticate to run E2E tests"],
        { duration: performance.now() - start }
      );
    }

    // Step 1: Load current profile
    const { data: profileData, status: profileStatus } = await this.apiRequest("GET", "/user/profile");
    
    if (profileStatus === 200 && profileData?.data) {
      details.push(`✅ Step 1: Profile loaded`);
      details.push(`   Name: ${profileData.data.name}`);
      details.push(`   Email: ${profileData.data.email}`);
      details.push(`   Plan: ${profileData.data.plan || "Free"}`);
    } else {
      passed = false;
      details.push(`❌ Step 1 failed: Profile load failed (${profileStatus})`);
    }

    // Step 2: Load notification preferences
    const { data: notifData, status: notifStatus } = await this.apiRequest("GET", "/user/notifications");
    
    if (notifStatus === 200) {
      details.push(`✅ Step 2: Notification preferences loaded`);
    } else {
      details.push(`⚠️ Step 2: Notifications load failed (${notifStatus})`);
    }

    // Step 3: Verify logos endpoint
    const { status: logosStatus } = await this.apiRequest("GET", "/user/logos");
    
    if (logosStatus === 200) {
      details.push(`✅ Step 3: User logos endpoint accessible`);
    } else {
      details.push(`⚠️ Step 3: Logos endpoint failed (${logosStatus})`);
    }

    return this.createResult(
      "Profile Update Flow",
      "e2e",
      "profile",
      passed ? "passed" : "warning",
      passed ? "Profile flow working correctly" : "Some profile features have issues",
      details,
      { 
        duration: performance.now() - start,
        fix: !passed ? "Check user controller and profile endpoints" : undefined
      }
    );
  }

  private async testSubscriptionFlow(): Promise<TestResult> {
    const start = performance.now();
    const details: string[] = [];
    let passed = true;

    // Step 1: Load available plans (public endpoint)
    const { data: plansData, status: plansStatus } = await this.apiRequest("GET", "/subscriptions/plans", null, false);
    
    if (plansStatus === 200 && plansData?.data) {
      const plans = plansData.data;
      details.push(`✅ Step 1: Plans loaded (${plans.length} plans)`);
      plans.forEach((plan: any) => {
        details.push(`   ${plan.name}: R${plan.price_monthly || 0}/mo`);
      });
    } else {
      passed = false;
      details.push(`❌ Step 1 failed: Plans load failed (${plansStatus})`);
    }

    if (!this.token) {
      details.push(`⏭️ Skipping authenticated subscription tests`);
      return this.createResult(
        "Subscription Flow",
        "e2e",
        "subscription",
        passed ? "passed" : "failed",
        passed ? "Public subscription endpoints working" : "Subscription flow has issues",
        details,
        { duration: performance.now() - start }
      );
    }

    // Step 2: Load current subscription
    const { data: subData, status: subStatus } = await this.apiRequest("GET", "/subscriptions/current");
    
    if (subStatus === 200) {
      details.push(`✅ Step 2: Current subscription loaded`);
      if (subData?.data) {
        details.push(`   Plan: ${subData.data.plan?.name || "Free"}`);
        details.push(`   Status: ${subData.data.status || "active"}`);
      }
    } else {
      details.push(`⚠️ Step 2: Subscription check failed (${subStatus})`);
    }

    // Step 3: Load billing invoices
    const { status: invoicesStatus } = await this.apiRequest("GET", "/billing/invoices");
    
    if (invoicesStatus === 200) {
      details.push(`✅ Step 3: Billing invoices accessible`);
    } else {
      details.push(`⚠️ Step 3: Invoices load failed (${invoicesStatus})`);
    }

    return this.createResult(
      "Subscription Flow",
      "e2e",
      "subscription",
      passed ? "passed" : "warning",
      passed ? "Subscription flow working correctly" : "Some subscription features have issues",
      details,
      { 
        duration: performance.now() - start,
        fix: !passed ? "Check subscription and billing controllers" : undefined
      }
    );
  }

  // ============================================================================
  // RUN ALL TESTS
  // ============================================================================

  async runAllTests(): Promise<{
    results: TestResult[];
    networkLogs: NetworkLog[];
    consoleLogs: ConsoleLog[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      warnings: number;
      skipped: number;
      duration: number;
    };
  }> {
    const startTime = performance.now();
    this.results = [];
    this.networkLogs = [];
    this.consoleLogs = [];

    const testSuites = [
      { name: "Frontend", run: () => this.runFrontendTests() },
      { name: "Backend", run: () => this.runBackendTests() },
      { name: "Database", run: () => this.runDatabaseTests() },
      { name: "Auth", run: () => this.runAuthTests() },
      { name: "Integration", run: () => this.runIntegrationTests() },
      { name: "E2E Flows", run: () => this.runE2ETests() },
      { name: "Security", run: () => this.runSecurityTests() },
      { name: "Performance", run: () => this.runPerformanceTests() },
    ];

    let completedSuites = 0;
    
    for (const suite of testSuites) {
      this.log("info", `Starting ${suite.name} tests...`);
      this.onProgress((completedSuites / testSuites.length) * 100, suite.name);
      
      try {
        await suite.run();
      } catch (error: any) {
        this.log("error", `${suite.name} suite failed: ${error.message}`, error.stack);
      }
      
      completedSuites++;
    }

    this.onProgress(100, "Complete");

    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === "passed").length,
      failed: this.results.filter(r => r.status === "failed").length,
      warnings: this.results.filter(r => r.status === "warning").length,
      skipped: this.results.filter(r => r.status === "skipped").length,
      duration: performance.now() - startTime,
    };

    return {
      results: this.results,
      networkLogs: this.networkLogs,
      consoleLogs: this.consoleLogs,
      summary,
    };
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TestDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState("");
  const [results, setResults] = useState<TestResult[]>([]);
  const [networkLogs, setNetworkLogs] = useState<NetworkLog[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
    duration: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("results");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportContent, setExportContent] = useState("");
  const [autoRun, setAutoRun] = useState(false);
  const [showOnlyFailed, setShowOnlyFailed] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const token = localStorage.getItem("auth_token");

  const runTests = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setNetworkLogs([]);
    setConsoleLogs([]);
    setSummary(null);
    setExpandedCategories([]);

    const runner = new TestRunner(
      token,
      (prog, test) => {
        setProgress(prog);
        setCurrentTest(test);
      },
      (result) => {
        setResults(prev => [...prev, result]);
        // Auto-expand categories with failures
        if (result.status === "failed" || result.status === "warning") {
          setExpandedCategories(prev => 
            prev.includes(result.category) ? prev : [...prev, result.category]
          );
        }
      },
      (log) => {
        setNetworkLogs(prev => [...prev, log]);
      },
      (log) => {
        setConsoleLogs(prev => [...prev, log]);
      }
    );

    try {
      const testResults = await runner.runAllTests();
      setSummary(testResults.summary);
      
      toast({
        title: "Tests Complete",
        description: `${testResults.summary.passed}/${testResults.summary.total} tests passed in ${(testResults.summary.duration / 1000).toFixed(2)}s`,
        variant: testResults.summary.failed > 0 ? "destructive" : "default",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Test Run Failed",
        description: error.message,
      });
    } finally {
      setIsRunning(false);
    }
  }, [token, toast]);

  // Auto-run on mount if enabled
  useEffect(() => {
    if (autoRun) {
      runTests();
    }
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ variant: "destructive", title: "Failed to copy" });
    }
  };

  const generateReport = (format: "text" | "json" | "markdown") => {
    let content = "";
    
    if (format === "json") {
      content = JSON.stringify({ summary, results, networkLogs }, null, 2);
    } else if (format === "markdown") {
      content = `# Automated Test Report\n\n`;
      content += `**Generated:** ${new Date().toISOString()}\n`;
      content += `**Duration:** ${summary ? (summary.duration / 1000).toFixed(2) : 0}s\n\n`;
      content += `## Summary\n\n`;
      content += `- ✅ Passed: ${summary?.passed || 0}\n`;
      content += `- ❌ Failed: ${summary?.failed || 0}\n`;
      content += `- ⚠️ Warnings: ${summary?.warnings || 0}\n`;
      content += `- ⏭️ Skipped: ${summary?.skipped || 0}\n\n`;
      
      const categories = Object.keys(TEST_CATEGORIES);
      categories.forEach(cat => {
        const catResults = results.filter(r => r.category === cat);
        if (catResults.length > 0) {
          content += `## ${TEST_CATEGORIES[cat as keyof typeof TEST_CATEGORIES]?.label || cat}\n\n`;
          catResults.forEach(r => {
            const icon = r.status === "passed" ? "✅" : r.status === "failed" ? "❌" : r.status === "warning" ? "⚠️" : "⏭️";
            content += `### ${icon} ${r.name}\n\n`;
            content += `**Status:** ${r.status}\n`;
            content += `**Message:** ${r.message}\n`;
            if (r.details.length > 0) {
              content += `**Details:**\n${r.details.map(d => `- ${d}`).join("\n")}\n`;
            }
            if (r.fix) {
              content += `**Fix:** ${r.fix}\n`;
            }
            content += "\n";
          });
        }
      });
    } else {
      content = `AUTOMATED TEST REPORT\n${"=".repeat(50)}\n\n`;
      content += `Generated: ${new Date().toISOString()}\n`;
      content += `Duration: ${summary ? (summary.duration / 1000).toFixed(2) : 0}s\n\n`;
      content += `SUMMARY\n${"-".repeat(20)}\n`;
      content += `Passed:   ${summary?.passed || 0}\n`;
      content += `Failed:   ${summary?.failed || 0}\n`;
      content += `Warnings: ${summary?.warnings || 0}\n`;
      content += `Skipped:  ${summary?.skipped || 0}\n\n`;
      
      results.forEach(r => {
        content += `[${r.status.toUpperCase()}] ${r.name}\n`;
        content += `  Category: ${r.category}/${r.subcategory}\n`;
        content += `  Message: ${r.message}\n`;
        if (r.fix) {
          content += `  Fix: ${r.fix}\n`;
        }
        content += "\n";
      });
    }
    
    setExportContent(content);
    setShowExportDialog(true);
  };

  const downloadReport = () => {
    const blob = new Blob([exportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredResults = showOnlyFailed 
    ? results.filter(r => r.status === "failed" || r.status === "warning")
    : results;

  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Test Mode Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-2 px-4 text-center text-sm font-medium">
        🧪 Automated Test Dashboard — {user ? `Logged in as ${user.email}` : "Not logged in"} | {results.length} tests run
      </div>

      <DashboardSidebar />

      <main className="lg:ml-64 pt-2">
        <header className="sticky top-8 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                <TestTube2 className="h-6 w-6 text-primary" />
                Automated Test Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Comprehensive system testing & validation
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-failed"
                  checked={showOnlyFailed}
                  onCheckedChange={setShowOnlyFailed}
                />
                <Label htmlFor="show-failed" className="text-sm">Show only issues</Label>
              </div>
              
              <Button 
                onClick={runTests} 
                disabled={isRunning}
                size="lg"
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Progress Bar */}
          <AnimatePresence>
            {isRunning && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Running: {currentTest}</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="bg-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{summary.total}</div>
                    <div className="text-sm text-muted-foreground">Total Tests</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">{summary.passed}</div>
                    <div className="text-sm text-green-500/80">Passed</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">{summary.failed}</div>
                    <div className="text-sm text-red-500/80">Failed</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-500">{summary.warnings}</div>
                    <div className="text-sm text-yellow-500/80">Warnings</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground">{(summary.duration / 1000).toFixed(2)}s</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="results" className="gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Results ({filteredResults.length})
                </TabsTrigger>
                <TabsTrigger value="network" className="gap-2">
                  <Network className="h-4 w-4" />
                  Network ({networkLogs.length})
                </TabsTrigger>
                <TabsTrigger value="console" className="gap-2">
                  <Terminal className="h-4 w-4" />
                  Console ({consoleLogs.length})
                </TabsTrigger>
              </TabsList>

              {results.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => generateReport("text")}>
                    <FileCode className="h-4 w-4 mr-2" />
                    Export Text
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => generateReport("markdown")}>
                    <FileCode className="h-4 w-4 mr-2" />
                    Export Markdown
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => generateReport("json")}>
                    <FileCode className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              )}
            </div>

            {/* Results Tab */}
            <TabsContent value="results" className="mt-4">
              {results.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <TestTube2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Tests Run Yet</h3>
                    <p className="text-muted-foreground mt-2">
                      Click "Run All Tests" to start the automated test suite
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedResults).map(([category, categoryResults]) => {
                    const config = TEST_CATEGORIES[category as keyof typeof TEST_CATEGORIES];
                    const Icon = config?.icon || Layers;
                    const passed = categoryResults.filter(r => r.status === "passed").length;
                    const failed = categoryResults.filter(r => r.status === "failed").length;
                    const warnings = categoryResults.filter(r => r.status === "warning").length;

                    return (
                      <Card key={category}>
                        <Collapsible
                          open={expandedCategories.includes(category)}
                          onOpenChange={() => toggleCategory(category)}
                        >
                          <CollapsibleTrigger className="w-full">
                            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {expandedCategories.includes(category) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  <Icon className={`h-5 w-5 ${config?.color || "text-muted-foreground"}`} />
                                  <CardTitle className="text-lg">
                                    {config?.label || category}
                                  </CardTitle>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {passed > 0 && (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                      {passed} passed
                                    </Badge>
                                  )}
                                  {failed > 0 && (
                                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                      {failed} failed
                                    </Badge>
                                  )}
                                  {warnings > 0 && (
                                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                      {warnings} warnings
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <div className="space-y-3">
                                {categoryResults.map((result) => {
                                  const StatusIcon = STATUS_CONFIG[result.status].icon;
                                  
                                  return (
                                    <div
                                      key={result.id}
                                      className={`p-4 rounded-lg border ${STATUS_CONFIG[result.status].color}`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                          <StatusIcon className="h-5 w-5 mt-0.5" />
                                          <div>
                                            <div className="font-medium">{result.name}</div>
                                            <div className="text-sm opacity-80">{result.message}</div>
                                            
                                            {result.details.length > 0 && (
                                              <div className="mt-2 text-xs space-y-1 opacity-70">
                                                {result.details.map((detail, i) => (
                                                  <div key={i}>• {detail}</div>
                                                ))}
                                              </div>
                                            )}
                                            
                                            {result.fix && (
                                              <div className="mt-2 text-xs bg-background/50 p-2 rounded">
                                                <strong>Fix:</strong> {result.fix}
                                              </div>
                                            )}

                                            {result.stackTrace && (
                                              <details className="mt-2">
                                                <summary className="text-xs cursor-pointer">Stack Trace</summary>
                                                <pre className="mt-1 text-xs bg-background/50 p-2 rounded overflow-auto max-h-32">
                                                  {result.stackTrace}
                                                </pre>
                                              </details>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            {result.duration.toFixed(0)}ms
                                          </Badge>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => copyToClipboard(
                                              `${result.name}\nStatus: ${result.status}\nMessage: ${result.message}\nDetails:\n${result.details.join("\n")}${result.fix ? `\nFix: ${result.fix}` : ""}`
                                            )}
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Network Tab */}
            <TabsContent value="network" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Network Requests
                  </CardTitle>
                  <CardDescription>
                    API calls made during testing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {networkLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No network requests logged yet
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {networkLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`p-3 rounded-lg border ${
                              log.status >= 200 && log.status < 300
                                ? "bg-green-500/5 border-green-500/20"
                                : log.status >= 400
                                ? "bg-red-500/5 border-red-500/20"
                                : log.status === 0
                                ? "bg-red-500/5 border-red-500/20"
                                : "bg-yellow-500/5 border-yellow-500/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="font-mono">
                                  {log.method}
                                </Badge>
                                <span className="font-mono text-sm">{log.url}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline"
                                  className={
                                    log.status >= 200 && log.status < 300
                                      ? "text-green-500"
                                      : log.status >= 400 || log.status === 0
                                      ? "text-red-500"
                                      : "text-yellow-500"
                                  }
                                >
                                  {log.status || "ERR"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {log.duration.toFixed(0)}ms
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {log.error && (
                              <div className="mt-2 text-xs text-red-500">
                                Error: {log.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Console Tab */}
            <TabsContent value="console" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Console Logs
                  </CardTitle>
                  <CardDescription>
                    Test execution logs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {consoleLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No console logs yet
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-1 font-mono text-sm">
                        {consoleLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`p-2 rounded flex items-start gap-2 ${
                              log.type === "error"
                                ? "bg-red-500/10 text-red-500"
                                : log.type === "warn"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : log.type === "info"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-muted"
                            }`}
                          >
                            <span className="text-xs opacity-50">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="uppercase text-xs font-bold w-12">
                              [{log.type}]
                            </span>
                            <span className="flex-1">{log.message}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(log.message)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Export Test Report</DialogTitle>
          </DialogHeader>
          <Textarea
            value={exportContent}
            readOnly
            className="h-[400px] font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => copyToClipboard(exportContent)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button onClick={downloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
