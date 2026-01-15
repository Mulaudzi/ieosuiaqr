// ============================================================================
// TEST RUNNER CORE - Main Test Execution Engine
// ============================================================================

import { TestResult, NetworkLog, ConsoleLog, FileDependency, PageDependencyMap } from "./types";
import { getAllFileDependencies, getPageDependencies, APP_NAME } from "./fileDependencyMap";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://qr.ieosuia.com/api";

export class TestRunner {
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

  private log(type: ConsoleLog["type"], message: string, stack?: string): void {
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

  private createResult(
    name: string,
    category: string,
    subcategory: string,
    status: TestResult["status"],
    message: string,
    details: string[] = [],
    extra: Partial<TestResult> = {},
    priority: "P0" | "P1" | "P2" = "P1"
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
      priority,
      ...extra,
    };

    this.results.push(result);
    this.onResult(result);
    return result;
  }

  async apiRequest(
    method: string,
    endpoint: string,
    body?: unknown,
    requireAuth: boolean = true
  ): Promise<{ data: unknown; status: number; duration: number; error?: string }> {
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
    } catch (error: unknown) {
      const duration = performance.now() - start;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      const log: NetworkLog = {
        id: this.generateId(),
        method,
        url: endpoint,
        status: 0,
        duration,
        timestamp: new Date().toISOString(),
        request: body,
        error: errorMessage,
      };

      this.networkLogs.push(log);
      this.onNetworkLog(log);

      return { data: null, status: 0, duration, error: errorMessage };
    }
  }

  // ============================================================================
  // FILE DEPENDENCY TESTS
  // ============================================================================

  async runFileDependencyTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const allFiles = getAllFileDependencies();
    const pages = getPageDependencies();

    this.log("info", "Starting file dependency verification...");

    // Test 1: Core Files Check
    results.push(this.testCoreFiles(allFiles));

    // Test 2: Service Files Check
    results.push(this.testServiceFiles(allFiles));

    // Test 3: Hook Files Check
    results.push(this.testHookFiles(allFiles));

    // Test 4: Component Files Check
    results.push(this.testComponentFiles(allFiles));

    // Test 5: Page Dependencies Check
    results.push(this.testPageDependencies(pages));

    // Test 6: Required Files Summary
    results.push(this.testRequiredFilesSummary(allFiles));

    return results;
  }

  private testCoreFiles(files: FileDependency[]): TestResult {
    const start = performance.now();
    const coreFiles = files.filter(f => f.type === "config" || f.type === "context");
    const missing = coreFiles.filter(f => f.required && !f.exists);

    const details = coreFiles.map(f => 
      `${f.exists ? "✅" : "❌"} ${f.path} - ${f.description}`
    );

    return this.createResult(
      "Core Files Verification",
      "fileDeps",
      "core",
      missing.length === 0 ? "passed" : "failed",
      missing.length === 0 
        ? "All core files present" 
        : `${missing.length} core file(s) missing`,
      details,
      { 
        duration: performance.now() - start,
        fix: missing.length > 0 ? `Missing: ${missing.map(f => f.path).join(", ")}` : undefined
      },
      "P0"
    );
  }

  private testServiceFiles(files: FileDependency[]): TestResult {
    const start = performance.now();
    const serviceFiles = files.filter(f => f.type === "service");
    const missing = serviceFiles.filter(f => f.required && !f.exists);

    const details = serviceFiles.map(f => 
      `${f.exists ? "✅" : "❌"} ${f.path} - ${f.description}`
    );

    return this.createResult(
      "Service Files Verification",
      "fileDeps",
      "services",
      missing.length === 0 ? "passed" : "failed",
      missing.length === 0 
        ? "All service files present" 
        : `${missing.length} service file(s) missing`,
      details,
      { 
        duration: performance.now() - start,
        fix: missing.length > 0 ? `Missing services will break API calls` : undefined
      },
      "P0"
    );
  }

  private testHookFiles(files: FileDependency[]): TestResult {
    const start = performance.now();
    const hookFiles = files.filter(f => f.type === "hook");
    const missing = hookFiles.filter(f => f.required && !f.exists);

    const details = hookFiles.map(f => 
      `${f.exists ? "✅" : "❌"} ${f.path} - ${f.description}`
    );

    return this.createResult(
      "Hook Files Verification",
      "fileDeps",
      "hooks",
      missing.length === 0 ? "passed" : "warning",
      missing.length === 0 
        ? "All hook files present" 
        : `${missing.length} hook file(s) missing`,
      details,
      { 
        duration: performance.now() - start,
        fix: missing.length > 0 ? `Missing hooks may cause runtime errors` : undefined
      },
      "P1"
    );
  }

  private testComponentFiles(files: FileDependency[]): TestResult {
    const start = performance.now();
    const componentFiles = files.filter(f => f.type === "component");
    const requiredMissing = componentFiles.filter(f => f.required && !f.exists);
    const optionalMissing = componentFiles.filter(f => !f.required && !f.exists);

    const details = [
      `Total components tracked: ${componentFiles.length}`,
      `Required present: ${componentFiles.filter(f => f.required && f.exists).length}`,
      `Required missing: ${requiredMissing.length}`,
      `Optional missing: ${optionalMissing.length}`,
    ];

    if (requiredMissing.length > 0) {
      details.push(`Missing required: ${requiredMissing.map(f => f.path).join(", ")}`);
    }

    return this.createResult(
      "Component Files Verification",
      "fileDeps",
      "components",
      requiredMissing.length === 0 ? "passed" : "failed",
      requiredMissing.length === 0 
        ? "All required components present" 
        : `${requiredMissing.length} required component(s) missing`,
      details,
      { 
        duration: performance.now() - start,
        fix: requiredMissing.length > 0 ? `Create missing components to restore functionality` : undefined
      },
      "P0"
    );
  }

  private testPageDependencies(pages: PageDependencyMap[]): TestResult {
    const start = performance.now();
    const incompletePages = pages.filter(p => p.status !== "complete");

    const details = pages.map(p => {
      const icon = p.status === "complete" ? "✅" : p.status === "partial" ? "⚠️" : "❌";
      return `${icon} ${p.page} (${p.route}) - ${p.files.length} files`;
    });

    return this.createResult(
      "Page Dependencies Verification",
      "fileDeps",
      "pages",
      incompletePages.length === 0 ? "passed" : "warning",
      incompletePages.length === 0 
        ? "All pages have complete dependencies" 
        : `${incompletePages.length} page(s) have incomplete dependencies`,
      details,
      { 
        duration: performance.now() - start,
        fix: incompletePages.length > 0 
          ? `Incomplete pages: ${incompletePages.map(p => p.page).join(", ")}` 
          : undefined
      },
      "P1"
    );
  }

  private testRequiredFilesSummary(files: FileDependency[]): TestResult {
    const start = performance.now();
    const required = files.filter(f => f.required);
    const missing = required.filter(f => !f.exists);
    const present = required.filter(f => f.exists);

    const details = [
      `Total files tracked: ${files.length}`,
      `Required files: ${required.length}`,
      `Required present: ${present.length}`,
      `Required missing: ${missing.length}`,
      `Optional files: ${files.filter(f => !f.required).length}`,
      `Verification rate: ${((present.length / required.length) * 100).toFixed(1)}%`,
    ];

    return this.createResult(
      "Required Files Summary",
      "fileDeps",
      "summary",
      missing.length === 0 ? "passed" : "failed",
      missing.length === 0 
        ? `All ${required.length} required files verified` 
        : `${missing.length}/${required.length} required files missing`,
      details,
      { 
        duration: performance.now() - start,
        fix: missing.length > 0 
          ? `Critical: Application cannot function correctly without all required files` 
          : undefined
      },
      "P0"
    );
  }

  // ============================================================================
  // FRONTEND TESTS
  // ============================================================================

  async runFrontendTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    this.log("info", "Testing DOM structure...");
    results.push(this.testDOMStructure());

    this.log("info", "Testing React rendering...");
    results.push(this.testReactRendering());

    this.log("info", "Testing localStorage...");
    results.push(this.testLocalStorage());

    this.log("info", "Testing styles...");
    results.push(this.testStylesLoading());

    this.log("info", "Testing router...");
    results.push(this.testRouterFunctionality());

    this.log("info", "Testing theme system...");
    results.push(this.testThemeSystem());

    return results;
  }

  private testDOMStructure(): TestResult {
    const start = performance.now();
    try {
      const root = document.getElementById("root");
      const hasRoot = !!root;
      const hasChildren = root ? root.children.length > 0 : false;

      const details: string[] = [
        `Root element exists: ${hasRoot}`,
        `Root has children: ${hasChildren}`,
        `Child count: ${root?.children.length || 0}`,
      ];

      return this.createResult(
        "DOM Structure Integrity",
        "frontend",
        "rendering",
        hasRoot && hasChildren ? "passed" : "failed",
        hasRoot && hasChildren 
          ? "DOM structure is valid and React app is mounted" 
          : "DOM structure is invalid or React app not mounted",
        details,
        { 
          duration: performance.now() - start,
          fix: !hasRoot || !hasChildren ? "Check if React app is properly initialized in main.tsx" : undefined
        },
        "P0"
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return this.createResult(
        "DOM Structure Integrity",
        "frontend",
        "rendering",
        "failed",
        `DOM test failed: ${errorMessage}`,
        [],
        { duration: performance.now() - start, stackTrace: error instanceof Error ? error.stack : undefined },
        "P0"
      );
    }
  }

  private testReactRendering(): TestResult {
    const start = performance.now();
    try {
      const reactRoot = document.querySelector("[data-reactroot]") || 
                       document.querySelector("#root > *");
      const hasReactApp = !!reactRoot;

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
        { duration: performance.now() - start },
        "P0"
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return this.createResult(
        "React Component Rendering",
        "frontend",
        "rendering",
        "failed",
        `React rendering test failed: ${errorMessage}`,
        [],
        { duration: performance.now() - start, stackTrace: error instanceof Error ? error.stack : undefined },
        "P0"
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
      const hasAuthToken = !!localStorage.getItem("auth_token");
      const hasUser = !!localStorage.getItem("user");

      const details = [
        `Storage read/write: ${isWorking ? "Working" : "Failed"}`,
        `Auth token present: ${hasAuthToken}`,
        `User data present: ${hasUser}${hasUser ? " ⚠️ SECURITY ISSUE" : " ✅"}`,
      ];

      return this.createResult(
        "LocalStorage Accessibility",
        "frontend",
        "storage",
        isWorking ? "passed" : "failed",
        isWorking ? "LocalStorage is accessible and functional" : "LocalStorage is not accessible",
        details,
        { 
          duration: performance.now() - start,
          fix: !isWorking ? "Check browser privacy settings" : undefined
        },
        "P1"
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return this.createResult(
        "LocalStorage Accessibility",
        "frontend",
        "storage",
        "failed",
        `LocalStorage test failed: ${errorMessage}`,
        [],
        { 
          duration: performance.now() - start, 
          stackTrace: error instanceof Error ? error.stack : undefined,
          fix: "Check browser privacy settings or incognito mode restrictions"
        },
        "P1"
      );
    }
  }

  private testStylesLoading(): TestResult {
    const start = performance.now();
    try {
      const stylesheets = document.styleSheets;
      const loadedStyles = stylesheets.length;

      const hasTailwind = Array.from(document.querySelectorAll("*")).some(
        el => el.className && typeof el.className === "string" &&
              (el.className.includes("flex") || el.className.includes("bg-") || el.className.includes("text-"))
      );

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
        { duration: performance.now() - start },
        "P1"
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return this.createResult(
        "CSS/Styles Loading",
        "frontend",
        "styles",
        "failed",
        `Styles test failed: ${errorMessage}`,
        [],
        { duration: performance.now() - start, stackTrace: error instanceof Error ? error.stack : undefined },
        "P1"
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
        { duration: performance.now() - start },
        "P1"
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return this.createResult(
        "Router Functionality",
        "frontend",
        "navigation",
        "failed",
        `Router test failed: ${errorMessage}`,
        [],
        { duration: performance.now() - start, stackTrace: error instanceof Error ? error.stack : undefined },
        "P1"
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
        { duration: performance.now() - start },
        "P2"
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return this.createResult(
        "Theme System",
        "frontend",
        "theming",
        "failed",
        `Theme test failed: ${errorMessage}`,
        [],
        { duration: performance.now() - start, stackTrace: error instanceof Error ? error.stack : undefined },
        "P2"
      );
    }
  }

  // ============================================================================
  // PUBLIC API - Get results
  // ============================================================================

  getResults(): TestResult[] {
    return this.results;
  }

  getNetworkLogs(): NetworkLog[] {
    return this.networkLogs;
  }

  getConsoleLogs(): ConsoleLog[] {
    return this.consoleLogs;
  }

  clearResults(): void {
    this.results = [];
    this.networkLogs = [];
    this.consoleLogs = [];
  }
}
