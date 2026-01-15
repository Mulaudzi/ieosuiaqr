// ============================================================================
// DOCUMENTATION GENERATOR - Creates Application Structure Document
// ============================================================================

import { 
  ApplicationStructure, 
  TestSummary, 
  FileDependency, 
  PageDependencyMap 
} from "./types";
import { 
  APP_NAME, 
  getAllFileDependencies, 
  getPageDependencies,
  CORE_FILES,
  SERVICE_FILES,
  HOOK_FILES,
  QR_COMPONENTS,
  UI_COMPONENTS,
} from "./fileDependencyMap";

export function generateApplicationStructure(testSummary: TestSummary): ApplicationStructure {
  const allFiles = getAllFileDependencies();
  const pages = getPageDependencies();
  
  return {
    appName: APP_NAME,
    generatedAt: new Date().toISOString(),
    version: "1.0.0",
    summary: {
      totalPages: pages.length,
      totalComponents: allFiles.filter(f => f.type === "component").length,
      totalHooks: allFiles.filter(f => f.type === "hook").length,
      totalServices: allFiles.filter(f => f.type === "service").length,
      totalFiles: allFiles.length,
    },
    pages,
    components: allFiles.filter(f => f.type === "component"),
    hooks: allFiles.filter(f => f.type === "hook"),
    services: allFiles.filter(f => f.type === "service"),
    contexts: allFiles.filter(f => f.type === "context"),
    testResults: testSummary,
  };
}

export function generateMarkdownDocumentation(structure: ApplicationStructure): string {
  let doc = `# ${structure.appName} Application Structure\n\n`;
  doc += `> Auto-generated documentation by Automated Test System\n`;
  doc += `> Generated: ${new Date(structure.generatedAt).toLocaleString()}\n\n`;
  
  doc += `---\n\n`;
  doc += `## 📊 Summary\n\n`;
  doc += `| Metric | Count |\n`;
  doc += `|--------|-------|\n`;
  doc += `| Total Pages | ${structure.summary.totalPages} |\n`;
  doc += `| Total Components | ${structure.summary.totalComponents} |\n`;
  doc += `| Total Hooks | ${structure.summary.totalHooks} |\n`;
  doc += `| Total Services | ${structure.summary.totalServices} |\n`;
  doc += `| Total Files Tracked | ${structure.summary.totalFiles} |\n\n`;
  
  doc += `### 🧪 Test Results Summary\n\n`;
  doc += `| Status | Count |\n`;
  doc += `|--------|-------|\n`;
  doc += `| ✅ Passed | ${structure.testResults.passed} |\n`;
  doc += `| ❌ Failed | ${structure.testResults.failed} |\n`;
  doc += `| ⚠️ Warnings | ${structure.testResults.warnings} |\n`;
  doc += `| ⏭️ Skipped | ${structure.testResults.skipped} |\n`;
  doc += `| 📁 Files Verified | ${structure.testResults.filesVerified} |\n`;
  doc += `| ❓ Files Missing | ${structure.testResults.filesMissing} |\n`;
  doc += `| 📄 Pages Analyzed | ${structure.testResults.pagesAnalyzed} |\n`;
  doc += `| ⏱️ Duration | ${(structure.testResults.duration / 1000).toFixed(2)}s |\n\n`;
  
  doc += `---\n\n`;
  doc += `## 📄 Pages & Routes\n\n`;
  
  structure.pages.forEach(page => {
    const statusIcon = page.status === "complete" ? "✅" : page.status === "partial" ? "⚠️" : "❌";
    doc += `### ${statusIcon} ${page.page}\n\n`;
    doc += `- **Route:** \`${page.route}\`\n`;
    doc += `- **Status:** ${page.status}\n`;
    doc += `- **Required Files:**\n\n`;
    
    page.files.forEach(file => {
      const existsIcon = file.exists ? "✓" : "✗";
      const requiredLabel = file.required ? "(required)" : "(optional)";
      doc += `  - ${existsIcon} \`${file.path}\` ${requiredLabel} - ${file.description}\n`;
    });
    doc += `\n`;
  });
  
  doc += `---\n\n`;
  doc += `## 🧩 Core Files\n\n`;
  doc += `### Entry Points & Config\n\n`;
  doc += generateFileTable(CORE_FILES.filter(f => f.type === "config"));
  
  doc += `### Layout Components\n\n`;
  doc += generateFileTable(CORE_FILES.filter(f => f.path.includes("layout")));
  
  doc += `### Auth Components\n\n`;
  doc += generateFileTable(CORE_FILES.filter(f => f.path.includes("auth")));
  
  doc += `---\n\n`;
  doc += `## 🔌 Services (API Layer)\n\n`;
  doc += generateFileTable(SERVICE_FILES);
  
  doc += `---\n\n`;
  doc += `## 🪝 Hooks\n\n`;
  doc += generateFileTable(HOOK_FILES);
  
  doc += `---\n\n`;
  doc += `## 📱 QR Code Components\n\n`;
  doc += generateFileTable(QR_COMPONENTS);
  
  doc += `---\n\n`;
  doc += `## 🎨 UI Components (shadcn/ui)\n\n`;
  doc += generateFileTable(UI_COMPONENTS);
  
  doc += `---\n\n`;
  doc += `## 🔧 API Endpoints Reference\n\n`;
  doc += `### Authentication\n`;
  doc += `| Method | Endpoint | Description |\n`;
  doc += `|--------|----------|-------------|\n`;
  doc += `| POST | /auth/login | User login |\n`;
  doc += `| POST | /auth/register | User registration |\n`;
  doc += `| POST | /auth/logout | User logout |\n`;
  doc += `| GET | /user/profile | Get user profile |\n`;
  doc += `| PUT | /user/profile | Update user profile |\n`;
  doc += `| GET | /user/notifications | Get notification preferences |\n`;
  doc += `| PUT | /user/notifications | Update notification preferences |\n\n`;
  
  doc += `### QR Codes\n`;
  doc += `| Method | Endpoint | Description |\n`;
  doc += `|--------|----------|-------------|\n`;
  doc += `| GET | /qr | List all QR codes |\n`;
  doc += `| POST | /qr | Create new QR code |\n`;
  doc += `| GET | /qr/:id | Get single QR code |\n`;
  doc += `| PUT | /qr/:id | Update QR code |\n`;
  doc += `| DELETE | /qr/:id | Delete QR code |\n\n`;
  
  doc += `### Inventory\n`;
  doc += `| Method | Endpoint | Description |\n`;
  doc += `|--------|----------|-------------|\n`;
  doc += `| GET | /inventory | List inventory items |\n`;
  doc += `| POST | /inventory | Create inventory item |\n`;
  doc += `| GET | /inventory/:id | Get single item |\n`;
  doc += `| PUT | /inventory/:id | Update item |\n`;
  doc += `| DELETE | /inventory/:id | Delete item |\n`;
  doc += `| GET | /inventory/limits | Get inventory limits |\n`;
  doc += `| GET | /inventory/analytics | Get inventory analytics |\n\n`;
  
  doc += `### Analytics\n`;
  doc += `| Method | Endpoint | Description |\n`;
  doc += `|--------|----------|-------------|\n`;
  doc += `| GET | /analytics/dashboard | Dashboard analytics |\n`;
  doc += `| GET | /analytics/summary | Analytics summary |\n`;
  doc += `| GET | /analytics/devices | Device breakdown |\n`;
  doc += `| GET | /analytics/daily | Daily trends |\n\n`;
  
  doc += `### Subscriptions & Billing\n`;
  doc += `| Method | Endpoint | Description |\n`;
  doc += `|--------|----------|-------------|\n`;
  doc += `| GET | /subscriptions/plans | List available plans |\n`;
  doc += `| GET | /subscriptions/current | Get current subscription |\n`;
  doc += `| POST | /subscriptions/checkout | Create checkout session |\n`;
  doc += `| GET | /billing/invoices | List invoices |\n`;
  doc += `| GET | /billing/payments | List payments |\n\n`;
  
  doc += `---\n\n`;
  doc += `## 📦 Database Tables\n\n`;
  doc += `| Table | Description | Key Fields |\n`;
  doc += `|-------|-------------|------------|\n`;
  doc += `| users | User accounts | id, email, name, password_hash, plan |\n`;
  doc += `| qr_codes | QR code records | id, user_id, type, name, content, design |\n`;
  doc += `| scan_logs | QR scan history | id, qr_id, timestamp, device, location |\n`;
  doc += `| inventory_items | Inventory records | id, user_id, qr_id, name, quantity |\n`;
  doc += `| subscriptions | User subscriptions | id, user_id, plan_id, status, expires_at |\n`;
  doc += `| plans | Subscription plans | id, name, price_monthly, features |\n`;
  doc += `| invoices | Billing invoices | id, user_id, amount, status, created_at |\n`;
  doc += `| design_presets | Saved QR designs | id, user_id, name, design_config |\n`;
  doc += `| user_logos | Uploaded logos | id, user_id, logo_path, created_at |\n\n`;
  
  doc += `---\n\n`;
  doc += `## 🚀 Production Checklist\n\n`;
  doc += `- [ ] All required files present\n`;
  doc += `- [ ] All API endpoints responding\n`;
  doc += `- [ ] Database connectivity verified\n`;
  doc += `- [ ] Authentication flow working\n`;
  doc += `- [ ] Security checks passed\n`;
  doc += `- [ ] Performance metrics acceptable\n`;
  doc += `- [ ] No sensitive data in localStorage\n`;
  doc += `- [ ] Error handling in place\n\n`;
  
  doc += `---\n\n`;
  doc += `*This document was auto-generated by the ${structure.appName} Automated Test System.*\n`;
  
  return doc;
}

function generateFileTable(files: FileDependency[]): string {
  let table = `| File | Type | Required | Status | Description |\n`;
  table += `|------|------|----------|--------|-------------|\n`;
  
  files.forEach(file => {
    const status = file.exists ? "✅ Present" : "❌ Missing";
    const required = file.required ? "Yes" : "No";
    table += `| \`${file.path}\` | ${file.type} | ${required} | ${status} | ${file.description} |\n`;
  });
  
  table += `\n`;
  return table;
}

export function generateJSONDocumentation(structure: ApplicationStructure): string {
  return JSON.stringify(structure, null, 2);
}

export function downloadDocumentation(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
