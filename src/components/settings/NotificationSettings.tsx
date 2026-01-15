import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/services/api/auth";
import {
  Bell,
  Mail,
  Package,
  Clock,
  Activity,
  BarChart3,
  Check,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface NotificationPreferences {
  // General
  emailNotifications: boolean;
  scanAlerts: boolean;
  weeklyReport: boolean;
  marketingEmails: boolean;
  // Inventory-specific
  notifyStatusChange: boolean;
  notifyLowActivity: boolean;
  notifyMaintenance: boolean;
  lowActivityDays: number;
}

const defaultPrefs: NotificationPreferences = {
  emailNotifications: true,
  scanAlerts: true,
  weeklyReport: false,
  marketingEmails: false,
  notifyStatusChange: true,
  notifyLowActivity: true,
  notifyMaintenance: true,
  lowActivityDays: 30,
};

export function NotificationSettings() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);

  // Load preferences from API on mount (no localStorage for security)
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const response = await authApi.getNotificationPreferences();
        if (response.success && response.data) {
          setPrefs({
            ...defaultPrefs,
            emailNotifications: response.data.email_notifications ?? true,
            scanAlerts: response.data.scan_alerts ?? true,
            weeklyReport: response.data.weekly_report ?? false,
            marketingEmails: response.data.marketing_emails ?? false,
          });
        }
      } catch {
        // Use defaults if API fails
      }
    };
    loadPrefs();
    // Clean up any legacy localStorage data
    localStorage.removeItem("notification_preferences");
  }, []);

  const updatePref = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to API only - no localStorage for security
      await authApi.updateProfile({
        notify_status_change: prefs.notifyStatusChange,
        notify_low_activity: prefs.notifyLowActivity,
        notify_maintenance: prefs.notifyMaintenance,
        low_activity_days: prefs.lowActivityDays,
      });
      
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      console.warn("Failed to sync notification preferences to server:", error);
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: "Could not update notification preferences. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* General Email Notifications */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold">Email Notifications</h3>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Master switch for all email notifications
              </p>
            </div>
            <Switch
              checked={prefs.emailNotifications}
              onCheckedChange={(v) => updatePref("emailNotifications", v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Bell className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Scan Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when your QR codes reach scan milestones
                </p>
              </div>
            </div>
            <Switch
              checked={prefs.scanAlerts}
              onCheckedChange={(v) => updatePref("scanAlerts", v)}
              disabled={!prefs.emailNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <BarChart3 className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Weekly Report</p>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of your QR code performance
                </p>
              </div>
            </div>
            <Switch
              checked={prefs.weeklyReport}
              onCheckedChange={(v) => updatePref("weeklyReport", v)}
              disabled={!prefs.emailNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Marketing Emails</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features and promotions
                </p>
              </div>
            </div>
            <Switch
              checked={prefs.marketingEmails}
              onCheckedChange={(v) => updatePref("marketingEmails", v)}
              disabled={!prefs.emailNotifications}
            />
          </div>
        </div>
      </div>

      {/* Inventory Alerts */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-5 h-5 text-accent" />
          <h3 className="font-display font-semibold">Inventory Alerts</h3>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <div>
                <p className="font-medium">Status Change Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when an inventory item's status changes
                </p>
              </div>
            </div>
            <Switch
              checked={prefs.notifyStatusChange}
              onCheckedChange={(v) => updatePref("notifyStatusChange", v)}
              disabled={!prefs.emailNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Maintenance Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Receive alerts for upcoming maintenance due dates
                </p>
              </div>
            </div>
            <Switch
              checked={prefs.notifyMaintenance}
              onCheckedChange={(v) => updatePref("notifyMaintenance", v)}
              disabled={!prefs.emailNotifications}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Activity className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Low Activity Warnings</p>
                  <p className="text-sm text-muted-foreground">
                    Alert when items haven't been scanned in a while
                  </p>
                </div>
              </div>
              <Switch
                checked={prefs.notifyLowActivity}
                onCheckedChange={(v) => updatePref("notifyLowActivity", v)}
                disabled={!prefs.emailNotifications}
              />
            </div>

            {prefs.notifyLowActivity && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-7 p-4 rounded-xl bg-muted/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm">Low Activity Threshold</Label>
                  <span className="text-sm font-medium text-primary">
                    {prefs.lowActivityDays} days
                  </span>
                </div>
                <Slider
                  value={[prefs.lowActivityDays]}
                  onValueChange={([v]) => updatePref("lowActivityDays", v)}
                  min={7}
                  max={90}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Items without scans for {prefs.lowActivityDays} days will trigger an alert
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <Button variant="hero" onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Check className="w-4 h-4 mr-2" />
        )}
        {isSaving ? "Saving..." : "Save Preferences"}
      </Button>
    </motion.div>
  );
}
