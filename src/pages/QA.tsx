import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPlan } from "@/hooks/useUserPlan";
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
  Plus,
  Mail,
  Settings,
  BarChart3,
  QrCode,
  FileText,
  MessageSquare,
  Zap,
  Users,
  CreditCard,
  Server,
  Eye,
  Package,
} from "lucide-react";

// Types
interface TestResult {
  name: string;
  system: string;
  component: string;
  status: "passed" | "warning" | "error" | "missing";
  message: string;
  details: string[];
  suggestion?: string;
}

interface TestCategory {
  [key: string]: TestResult[];
}

interface TestResults {
  system: string;
  user_mode: string;
  timestamp: string;
  duration_ms: number;
  summary: {
    total_tests: number;
    passed: number;
    warnings: number;
    errors: number;
    missing: number;
  };
  tests: {
    [system: string]: TestCategory;
  };
}

interface QuickStats {
  users: number;
  qr_codes: number;
  invoices: number;
  failed_emails: number;
}

interface SystemHealth {
  tables_found: number;
  tables_required: number;
  health: "healthy" | "partial" | "missing";
}

interface DashboardData {
  systems: Record<string, SystemHealth>;
  quick_stats: QuickStats;
}

// Status configs
const statusConfig = {
  passed: { label: "Passed", color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  warning: { label: "Warning", color: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
  error: { label: "Error", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  missing: { label: "Missing", color: "bg-muted text-muted-foreground border-muted", icon: HelpCircle },
};

const componentIcons: Record<string, React.ElementType> = {
  database: Database,
  api: Globe,
  ui: Layout,
  permissions: Lock,
  logic: Cpu,
  integration: Link2,
};

const systemConfig = {
  sms: { label: "SMS System", icon: MessageSquare, color: "text-blue-500" },
  qr: { label: "QR System", icon: QrCode, color: "text-primary" },
  invoicing: { label: "Invoicing", icon: FileText, color: "text-green-500" },
  shared: { label: "Shared Services", icon: Server, color: "text-purple-500" },
  cross_system: { label: "Cross-System", icon: Link2, color: "text-orange-500" },
};

export default function QA() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [results, setResults] = useState<TestResults | null>(null);
  const [selectedSystem, setSelectedSystem] = useState("all");
  const [userMode, setUserMode] = useState("normal");
  const [includeSeeding, setIncludeSeeding] = useState(false);
  const [seedCount, setSeedCount] = useState(5);
  const [expandedSystems, setExpandedSystems] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSeedingDialog, setShowSeedingDialog] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("text");
  const [exportContent, setExportContent] = useState("");
  const [seedingResult, setSeedingResult] = useState<any>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [seedingStatus, setSeedingStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const { plan } = useUserPlan();

  const userToken = localStorage.getItem("auth_token");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/qa/dashboard", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDashboard(data.data);
      }
      await fetchSeedingStatus();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load dashboard" });
    } finally {
      setIsLoading(false);
    }
  };

  const runQA = async () => {
    setIsRunning(true);
    setResults(null);
    setActiveTab("results");
    
    try {
      const response = await fetch("/api/admin/qa/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          system: selectedSystem,
          user_mode: userMode,
          include_seeding: includeSeeding,
        }),
      });

      if (!response.ok) throw new Error("QA run failed");

      const data = await response.json();
      setResults(data.data);
      
      const systemsWithIssues: string[] = [];
      Object.entries(data.data.tests).forEach(([sys, categories]) => {
        const hasIssue = Object.values(categories as TestCategory).some(tests =>
          tests.some(t => t.status !== "passed")
        );
        if (hasIssue) systemsWithIssues.push(sys);
      });
      setExpandedSystems(systemsWithIssues);
      
      toast({
        title: "QA Complete",
        description: `${data.data.summary.total_tests} tests run in ${data.data.duration_ms}ms`,
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to run QA tests" });
    } finally {
      setIsRunning(false);
    }
  };

  const seedTestData = async (count: number = 5) => {
    setIsSeeding(true);
    try {
      const response = await fetch("/api/admin/qa/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ system: selectedSystem, count }),
      });

      if (!response.ok) throw new Error("Seeding failed");

      const data = await response.json();
      setSeedingResult(data.data);
      setShowSeedingDialog(true);
      await fetchSeedingStatus();
      toast({ title: "Test Data Seeded", description: `Created ${Object.keys(data.data.seeded?.records || {}).length} system records` });
    } catch {
      toast({ variant: "destructive", title: "Seeding Failed" });
    } finally {
      setIsSeeding(false);
    }
  };

  const cleanupTestData = async (dryRun: boolean = false) => {
    setIsCleaning(true);
    try {
      const response = await fetch("/api/admin/qa/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ system: selectedSystem, dry_run: dryRun }),
      });

      if (!response.ok) throw new Error("Cleanup failed");

      const data = await response.json();
      setCleanupResult(data.data);
      setShowCleanupDialog(true);
      if (!dryRun) await fetchSeedingStatus();
      toast({ 
        title: dryRun ? "Dry Run Complete" : "Cleanup Complete", 
        description: `${data.data.cleaned?.totals?.deleted || 0} records deleted` 
      });
    } catch {
      toast({ variant: "destructive", title: "Cleanup Failed" });
    } finally {
      setIsCleaning(false);
    }
  };

  const fetchSeedingStatus = async () => {
    try {
      const response = await fetch("/api/admin/qa/status", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSeedingStatus(data.data);
      }
    } catch {
      // Silent fail
    }
  };

  const generateErrorReport = async (format: string) => {
    if (!results) return;

    try {
      const response = await fetch("/api/admin/qa/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ results, format }),
      });

      if (!response.ok) throw new Error("Report generation failed");

      const data = await response.json();
      setExportContent(format === "json" 
        ? JSON.stringify(data.data.errors, null, 2) 
        : data.data.report);
      setShowExportDialog(true);
    } catch {
      toast({ variant: "destructive", title: "Export Failed" });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportContent);
    toast({ title: "Copied to clipboard" });
  };

  const downloadReport = () => {
    const ext = exportFormat === "json" ? "json" : exportFormat === "markdown" ? "md" : "txt";
    const blob = new Blob([exportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qa-report-${new Date().toISOString().split("T")[0]}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSystem = (system: string) => {
    setExpandedSystems(prev =>
      prev.includes(system) ? prev.filter(s => s !== system) : [...prev, system]
    );
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy": return "bg-success/10 text-success";
      case "partial": return "bg-warning/10 text-warning";
      case "missing": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const errorsOnly = results
    ? Object.entries(results.tests).flatMap(([sys, cats]) =>
        Object.entries(cats).flatMap(([cat, tests]) =>
          tests.filter(t => t.status !== "passed")
        )
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* QA Mode Banner */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm font-medium">
        🧪 QA Mode — System: {selectedSystem === "all" ? "Full Platform" : systemConfig[selectedSystem as keyof typeof systemConfig]?.label || selectedSystem} | User Mode: {userMode.charAt(0).toUpperCase() + userMode.slice(1)}
      </div>

      <DashboardSidebar />

      {/* Main Content */}
      <main className="lg:ml-64 pt-2">
        <header className="sticky top-8 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                System QA & Debug Console
              </h1>
              <p className="text-sm text-muted-foreground">
                Test and debug platform systems
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Test Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* System Selector */}
                <div className="space-y-2">
                  <Label>System</Label>
                  <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Full Platform (All)</SelectItem>
                      <SelectItem value="shared">Shared Services</SelectItem>
                      <SelectItem value="qr">QR System</SelectItem>
                      <SelectItem value="invoicing">Invoicing System</SelectItem>
                      <SelectItem value="sms">SMS System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User Mode */}
                <div className="space-y-2">
                  <Label>User Mode</Label>
                  <Select value={userMode} onValueChange={setUserMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="normal">Normal User</SelectItem>
                      <SelectItem value="readonly">Read-only User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Seeding Toggle */}
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch
                      id="seeding"
                      checked={includeSeeding}
                      onCheckedChange={setIncludeSeeding}
                    />
                    <Label htmlFor="seeding" className="text-sm">Include seeding</Label>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Label>Actions</Label>
                  <div className="flex gap-2">
                    <Button onClick={runQA} disabled={isRunning} className="flex-1">
                      {isRunning ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Run QA
                    </Button>
                  </div>
                </div>
              </div>

              {/* Additional Actions */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => seedTestData(seedCount)}
                  disabled={isSeeding}
                >
                  {isSeeding ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Seed Test Data
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => cleanupTestData(false)}
                  disabled={isCleaning}
                >
                  {isCleaning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Cleanup Test Data
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => cleanupTestData(true)}
                  disabled={isCleaning}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Dry Run
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => generateErrorReport(exportFormat)}
                  disabled={!results}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Errors Only
                </Button>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Plain Text</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="results" disabled={!results}>
                Results {results && (
                  <Badge variant="outline" className="ml-2">
                    {results.summary.errors + results.summary.warnings} issues
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="errors" disabled={errorsOnly.length === 0}>
                Errors Only
                {errorsOnly.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{errorsOnly.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : dashboard && (
                <>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <Users className="h-8 w-8 text-primary" />
                          <div>
                            <p className="text-2xl font-bold">{dashboard.quick_stats.users}</p>
                            <p className="text-sm text-muted-foreground">Users</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <QrCode className="h-8 w-8 text-primary" />
                          <div>
                            <p className="text-2xl font-bold">{dashboard.quick_stats.qr_codes}</p>
                            <p className="text-sm text-muted-foreground">QR Codes</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <CreditCard className="h-8 w-8 text-success" />
                          <div>
                            <p className="text-2xl font-bold">{dashboard.quick_stats.invoices}</p>
                            <p className="text-sm text-muted-foreground">Invoices</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <Mail className="h-8 w-8 text-destructive" />
                          <div>
                            <p className="text-2xl font-bold">{dashboard.quick_stats.failed_emails}</p>
                            <p className="text-sm text-muted-foreground">Failed Emails</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* System Health */}
                  <Card>
                    <CardHeader>
                      <CardTitle>System Health</CardTitle>
                      <CardDescription>Database table coverage per system</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(dashboard.systems).map(([sys, health]) => {
                          const config = systemConfig[sys as keyof typeof systemConfig];
                          const Icon = config?.icon || Server;
                          const progress = (health.tables_found / health.tables_required) * 100;
                          
                          return (
                            <Card key={sys} className="border-2">
                              <CardContent className="pt-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <Icon className={`h-6 w-6 ${config?.color || ''}`} />
                                  <div>
                                    <p className="font-semibold">{config?.label || sys}</p>
                                    <Badge className={getHealthColor(health.health)}>
                                      {health.health}
                                    </Badge>
                                  </div>
                                </div>
                                <Progress value={progress} className="h-2 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  {health.tables_found} / {health.tables_required} tables
                                </p>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4">
              {results && (
                <>
                  {/* Summary */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-wrap items-center gap-4 justify-between">
                        <div className="flex gap-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold">{results.summary.total_tests}</p>
                            <p className="text-sm text-muted-foreground">Total Tests</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-success">{results.summary.passed}</p>
                            <p className="text-sm text-muted-foreground">Passed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-warning">{results.summary.warnings}</p>
                            <p className="text-sm text-muted-foreground">Warnings</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-destructive">{results.summary.errors}</p>
                            <p className="text-sm text-muted-foreground">Errors</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-muted-foreground">{results.summary.missing}</p>
                            <p className="text-sm text-muted-foreground">Missing</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="font-mono">{results.duration_ms}ms</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Test Results by System */}
                  <div className="space-y-4">
                    {Object.entries(results.tests).map(([system, categories]) => {
                      const config = systemConfig[system as keyof typeof systemConfig];
                      const Icon = config?.icon || Server;
                      const isExpanded = expandedSystems.includes(system);
                      
                      const systemStats = Object.values(categories as TestCategory).flat();
                      const passed = systemStats.filter(t => t.status === "passed").length;
                      const issues = systemStats.filter(t => t.status !== "passed").length;

                      return (
                        <Collapsible key={system} open={isExpanded}>
                          <Card>
                            <CollapsibleTrigger asChild>
                              <CardHeader 
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => toggleSystem(system)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                      <ChevronDown className="h-5 w-5" />
                                    ) : (
                                      <ChevronRight className="h-5 w-5" />
                                    )}
                                    <Icon className={`h-5 w-5 ${config?.color || ''}`} />
                                    <CardTitle className="text-lg">
                                      {config?.label || system}
                                    </CardTitle>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant="outline" className="bg-success/10 text-success">
                                      {passed} passed
                                    </Badge>
                                    {issues > 0 && (
                                      <Badge variant="destructive">
                                        {issues} issues
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <div className="space-y-4">
                                  {Object.entries(categories as TestCategory).map(([category, tests]) => {
                                    const catKey = `${system}-${category}`;
                                    const isCatExpanded = expandedCategories.includes(catKey);
                                    const CategoryIcon = componentIcons[category] || Cpu;
                                    const catIssues = tests.filter(t => t.status !== "passed").length;

                                    return (
                                      <Collapsible key={catKey} open={isCatExpanded}>
                                        <CollapsibleTrigger asChild>
                                          <div 
                                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50"
                                            onClick={() => toggleCategory(catKey)}
                                          >
                                            <div className="flex items-center gap-2">
                                              {isCatExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4" />
                                              )}
                                              <CategoryIcon className="h-4 w-4" />
                                              <span className="font-medium capitalize">{category}</span>
                                              <Badge variant="outline">{tests.length} tests</Badge>
                                            </div>
                                            {catIssues > 0 && (
                                              <Badge variant="destructive" className="text-xs">
                                                {catIssues} issues
                                              </Badge>
                                            )}
                                          </div>
                                        </CollapsibleTrigger>
                                        
                                        <CollapsibleContent>
                                          <div className="mt-2 space-y-2 pl-6">
                                            {tests.map((test, idx) => {
                                              const StatusIcon = statusConfig[test.status].icon;
                                              return (
                                                <motion.div
                                                  key={idx}
                                                  initial={{ opacity: 0, x: -10 }}
                                                  animate={{ opacity: 1, x: 0 }}
                                                  className={`p-3 rounded-lg border ${statusConfig[test.status].color}`}
                                                >
                                                  <div className="flex items-start gap-3">
                                                    <StatusIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                      <p className="font-medium">{test.name}</p>
                                                      <p className="text-sm opacity-80">{test.message}</p>
                                                      {test.details.length > 0 && (
                                                        <ul className="mt-1 text-xs opacity-70">
                                                          {test.details.map((d, i) => (
                                                            <li key={i}>• {d}</li>
                                                          ))}
                                                        </ul>
                                                      )}
                                                      {test.suggestion && (
                                                        <p className="mt-2 text-xs font-medium">
                                                          💡 {test.suggestion}
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                </motion.div>
                                              );
                                            })}
                                          </div>
                                        </CollapsibleContent>
                                      </Collapsible>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      );
                    })}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Errors Only Tab */}
            <TabsContent value="errors">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-destructive">
                      Errors & Warnings ({errorsOnly.length})
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => generateErrorReport(exportFormat)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      {errorsOnly.map((test, idx) => {
                        const StatusIcon = statusConfig[test.status].icon;
                        const SysConfig = systemConfig[test.system as keyof typeof systemConfig];
                        
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border ${statusConfig[test.status].color}`}
                          >
                            <div className="flex items-start gap-3">
                              <StatusIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">{SysConfig?.label || test.system}</Badge>
                                  <Badge variant="outline">{test.component}</Badge>
                                </div>
                                <p className="font-medium">{test.name}</p>
                                <p className="text-sm opacity-80">{test.message}</p>
                                {test.suggestion && (
                                  <p className="mt-2 text-sm bg-background/50 p-2 rounded">
                                    💡 <strong>Fix:</strong> {test.suggestion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
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
            <DialogTitle>Error Report</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <Textarea
              value={exportContent}
              readOnly
              className="font-mono text-sm min-h-[350px]"
            />
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button onClick={downloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Seeding Result Dialog */}
      <Dialog open={showSeedingDialog} onOpenChange={setShowSeedingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Test Data Seeded
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {seedingResult && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  System: <Badge>{seedingResult.seeded?.system || 'all'}</Badge>
                  <span className="ml-4">Timestamp: {seedingResult.seeded?.timestamp}</span>
                </div>
                
                {Object.entries(seedingResult.seeded?.records || {}).map(([system, data]: [string, any]) => (
                  <Card key={system}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm capitalize">{system}</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSeedingDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Result Dialog */}
      <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-warning" />
              {cleanupResult?.cleaned?.dry_run ? 'Cleanup Dry Run' : 'Cleanup Complete'}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {cleanupResult && (
              <div className="space-y-4">
                <div className="flex gap-4 text-sm">
                  <Badge variant={cleanupResult.cleaned?.dry_run ? "outline" : "default"}>
                    {cleanupResult.cleaned?.dry_run ? 'Dry Run' : 'Executed'}
                  </Badge>
                  <span>System: {cleanupResult.cleaned?.system}</span>
                </div>
                
                {cleanupResult.cleaned?.totals && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{cleanupResult.cleaned.totals.found}</p>
                      <p className="text-sm text-muted-foreground">Records Found</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-destructive">{cleanupResult.cleaned.totals.deleted}</p>
                      <p className="text-sm text-muted-foreground">Records Deleted</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {Object.entries(cleanupResult.cleaned?.records || {}).map(([table, data]: [string, any]) => (
                    <div key={table} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="font-mono text-sm">{table}</span>
                      <div className="flex gap-2">
                        {data.found !== undefined && (
                          <Badge variant="outline">Found: {data.found}</Badge>
                        )}
                        {data.deleted !== undefined && (
                          <Badge variant={data.deleted > 0 ? "destructive" : "outline"}>
                            Deleted: {data.deleted}
                          </Badge>
                        )}
                        {data.skipped && (
                          <Badge variant="secondary">Skipped</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            {cleanupResult?.cleaned?.dry_run && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  setShowCleanupDialog(false);
                  cleanupTestData(false);
                }}
              >
                Execute Cleanup
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowCleanupDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
