// ============================================================================
// AUTOMATED TEST SYSTEM TYPES
// ============================================================================

export interface TestResult {
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
  priority: "P0" | "P1" | "P2";
}

export interface FileDependency {
  path: string;
  type: "component" | "page" | "hook" | "service" | "context" | "config" | "style" | "asset" | "util";
  required: boolean;
  exists: boolean;
  description: string;
  usedBy: string[];
}

export interface PageDependencyMap {
  page: string;
  route: string;
  files: FileDependency[];
  status: "complete" | "partial" | "missing";
}

export interface NetworkLog {
  id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  timestamp: string;
  request?: unknown;
  response?: unknown;
  error?: string;
}

export interface ConsoleLog {
  id: string;
  type: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: string;
  stack?: string;
}

export interface SystemStatus {
  name: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  latency: number;
  lastCheck: string;
}

export interface TestSuite {
  name: string;
  category: string;
  tests: TestResult[];
  duration: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  duration: number;
  filesVerified: number;
  filesMissing: number;
  pagesAnalyzed: number;
}

export interface ApplicationStructure {
  appName: string;
  generatedAt: string;
  version: string;
  summary: {
    totalPages: number;
    totalComponents: number;
    totalHooks: number;
    totalServices: number;
    totalFiles: number;
  };
  pages: PageDependencyMap[];
  components: FileDependency[];
  hooks: FileDependency[];
  services: FileDependency[];
  contexts: FileDependency[];
  testResults: TestSummary;
}

export interface CleanupResult {
  itemsCleaned: number;
  details: string[];
}

export const TEST_CATEGORIES = {
  fileDeps: { label: "File Dependency Tests", icon: "FileCode", color: "text-indigo-500" },
  frontend: { label: "Frontend Tests", icon: "Layout", color: "text-blue-500" },
  backend: { label: "Backend API Tests", icon: "Server", color: "text-green-500" },
  database: { label: "Database Tests", icon: "Database", color: "text-purple-500" },
  auth: { label: "Authentication Tests", icon: "Lock", color: "text-orange-500" },
  integration: { label: "Integration Tests", icon: "Link2", color: "text-cyan-500" },
  e2e: { label: "E2E User Flow Tests", icon: "Activity", color: "text-pink-500" },
  security: { label: "Security Tests", icon: "Shield", color: "text-red-500" },
  performance: { label: "Performance Tests", icon: "Gauge", color: "text-yellow-500" },
} as const;

export const STATUS_CONFIG = {
  passed: { label: "Passed", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: "CheckCircle" },
  failed: { label: "Failed", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: "XCircle" },
  warning: { label: "Warning", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: "AlertTriangle" },
  skipped: { label: "Skipped", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: "HelpCircle" },
  running: { label: "Running", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: "RefreshCw" },
} as const;
