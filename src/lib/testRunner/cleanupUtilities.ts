// ============================================================================
// CLEANUP UTILITIES - Remove Test Artifacts and Mocks
// ============================================================================

import { CleanupResult } from "./types";

export function cleanupTestArtifacts(): CleanupResult {
  const result: CleanupResult = {
    itemsCleaned: 0,
    details: [],
  };

  // Clean localStorage test data
  const testKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith("__test") ||
      key.startsWith("test_") ||
      key.includes("mock") ||
      key.includes("_test_")
    )) {
      testKeys.push(key);
    }
  }

  testKeys.forEach(key => {
    localStorage.removeItem(key);
    result.itemsCleaned++;
    result.details.push(`Removed localStorage key: ${key}`);
  });

  // Clean sessionStorage test data
  const sessionTestKeys: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.startsWith("__test") ||
      key.startsWith("test_") ||
      key.includes("mock")
    )) {
      sessionTestKeys.push(key);
    }
  }

  sessionTestKeys.forEach(key => {
    sessionStorage.removeItem(key);
    result.itemsCleaned++;
    result.details.push(`Removed sessionStorage key: ${key}`);
  });

  // Clean up any global test variables
  const globalTestVars = Object.keys(window).filter(key => 
    key.startsWith("__test") || 
    key.startsWith("test_") ||
    key.includes("Mock") ||
    key.includes("Spy")
  );

  globalTestVars.forEach(key => {
    try {
      // @ts-ignore
      delete window[key];
      result.itemsCleaned++;
      result.details.push(`Removed global variable: ${key}`);
    } catch {
      result.details.push(`Could not remove global variable: ${key}`);
    }
  });

  // Clear any cached test results from IndexedDB (if applicable)
  if (window.indexedDB) {
    const testDatabases = ["test_db", "mock_db", "__test__"];
    testDatabases.forEach(dbName => {
      try {
        window.indexedDB.deleteDatabase(dbName);
        result.details.push(`Attempted cleanup of IndexedDB: ${dbName}`);
      } catch {
        // Ignore errors for non-existent databases
      }
    });
  }

  // Report cleanup completion
  if (result.itemsCleaned === 0) {
    result.details.push("No test artifacts found to clean up");
  } else {
    result.details.push(`Total items cleaned: ${result.itemsCleaned}`);
  }

  return result;
}

export function detectMockData(): { hasMocks: boolean; details: string[] } {
  const details: string[] = [];
  let hasMocks = false;

  // Check for mock data in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value && (
        value.includes("mock") ||
        value.includes("test") ||
        value.includes("fake")
      )) {
        details.push(`Potential mock data in localStorage: ${key}`);
        hasMocks = true;
      }
    }
  }

  // Check for mock functions on window
  const mockPatterns = ["mock", "stub", "spy", "fake", "sinon", "jest"];
  Object.keys(window).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (mockPatterns.some(pattern => lowerKey.includes(pattern))) {
      details.push(`Potential mock on window: ${key}`);
      hasMocks = true;
    }
  });

  // Check for test environment flags
  // @ts-ignore
  if (window.__TESTING__ || window.__TEST_MODE__ || window.__MOCK_MODE__) {
    details.push("Test environment flag detected on window object");
    hasMocks = true;
  }

  // Check for common mock libraries
  // @ts-ignore
  if (window.sinon || window.jest || window.jasmine) {
    details.push("Mock library detected on window object");
    hasMocks = true;
  }

  if (!hasMocks) {
    details.push("No mock data or test artifacts detected");
  }

  return { hasMocks, details };
}

export function forceRealMode(): { success: boolean; details: string[] } {
  const details: string[] = [];
  let success = true;

  try {
    // Remove any mock flags
    // @ts-ignore
    delete window.__TESTING__;
    // @ts-ignore
    delete window.__TEST_MODE__;
    // @ts-ignore
    delete window.__MOCK_MODE__;
    details.push("Cleared test mode flags");

    // Restore fetch if it was mocked
    // @ts-ignore
    if (window.__originalFetch__) {
      // @ts-ignore
      window.fetch = window.__originalFetch__;
      details.push("Restored original fetch");
    }

    // Clear any mock timers
    // Note: Can't fully clear these without reference to originals
    details.push("Test mode disabled - using real APIs");

  } catch (error) {
    success = false;
    details.push(`Error forcing real mode: ${error}`);
  }

  return { success, details };
}

export function cleanupLegacyData(): { cleaned: number; details: string[] } {
  const details: string[] = [];
  let cleaned = 0;

  // Legacy keys that should be cleaned up based on our security updates
  const legacyKeys = [
    "user",           // User data should not be in localStorage
    "userPlan",       // Plan data should be fetched from API
    "notification_preferences",  // Should be fetched from API
  ];

  legacyKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleaned++;
      details.push(`Removed legacy key: ${key}`);
    }
  });

  if (cleaned === 0) {
    details.push("No legacy data found to clean up");
  }

  return { cleaned, details };
}
