import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  Shield,
  Mail,
  Bell,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  LogOut,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
} from "lucide-react";

interface AdminSettings {
  notification_emails: { value: string[]; type: string; description: string };
  notify_on_contact: { value: boolean; type: string; description: string };
  notify_on_failed: { value: boolean; type: string; description: string };
  notify_on_bounce: { value: boolean; type: string; description: string };
  daily_digest_enabled: { value: boolean; type: string; description: string };
  daily_digest_time: { value: string; type: string; description: string };
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isValidSession, isChecking, requireAdminSession, clearAdminSession } = useAdminSession();

  const adminToken = localStorage.getItem("admin_token");

  useEffect(() => {
    if (isChecking) return;
    
    if (!isValidSession || !adminToken) {
      navigate("/login");
      return;
    }
    fetchSettings();
  }, [isChecking, isValidSession]);

  const fetchSettings = async () => {
    if (!requireAdminSession()) return;
    
    try {
      const verifyRes = await fetch(`/api/admin/verify?admin_token=${adminToken}`);
      if (!verifyRes.ok) {
        clearAdminSession();
        navigate("/login");
        return;
      }

      const response = await fetch("/api/admin/settings", {
        headers: { Authorization: `Admin ${adminToken}` },
      });

      if (!response.ok) throw new Error("Failed to fetch settings");

      const data = await response.json();
      setSettings(data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load settings.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const payload = {
        notification_emails: settings.notification_emails.value,
        notify_on_contact: settings.notify_on_contact.value,
        notify_on_failed: settings.notify_on_failed.value,
        notify_on_bounce: settings.notify_on_bounce.value,
        daily_digest_enabled: settings.daily_digest_enabled.value,
        daily_digest_time: settings.daily_digest_time.value,
      };

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Admin ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast({ title: "Settings saved successfully" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addEmail = () => {
    if (!newEmail.trim() || !settings) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({ variant: "destructive", title: "Invalid email address" });
      return;
    }

    if (settings.notification_emails.value.includes(newEmail)) {
      toast({ variant: "destructive", title: "Email already exists" });
      return;
    }

    setSettings({
      ...settings,
      notification_emails: {
        ...settings.notification_emails,
        value: [...settings.notification_emails.value, newEmail],
      },
    });
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      notification_emails: {
        ...settings.notification_emails,
        value: settings.notification_emails.value.filter((e) => e !== email),
      },
    });
  };

  const toggleSetting = (key: keyof AdminSettings) => {
    if (!settings) return;
    const setting = settings[key];
    if (setting.type !== "boolean") return;
    
    setSettings({
      ...settings,
      [key]: {
        ...setting,
        value: !setting.value,
      },
    });
  };

  const updateDigestTime = (time: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      daily_digest_time: {
        ...settings.daily_digest_time,
        value: time,
      },
    });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { Authorization: `Admin ${adminToken}` },
      });
    } catch { /* ignore */ }
    localStorage.removeItem("admin_token");
    navigate("/admin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Notification Settings</h1>
              <p className="text-xs text-muted-foreground">Configure email alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/users">
                <Users className="w-4 h-4 mr-2" />
                Manage Admins
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/emails">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Emails
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {settings && (
          <div className="space-y-6">
            {/* Notification Emails */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Notification Recipients
                  </CardTitle>
                  <CardDescription>
                    Email addresses that receive instant alerts for new contact form submissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Email List */}
                  <div className="space-y-2">
                    {settings.notification_emails.value.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{email}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmail(email)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {settings.notification_emails.value.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No notification emails configured
                      </p>
                    )}
                  </div>

                  {/* Add Email */}
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Add email address..."
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addEmail()}
                    />
                    <Button onClick={addEmail}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notification Triggers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Alert Triggers
                  </CardTitle>
                  <CardDescription>
                    Choose when to send instant email notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        New Contact Submissions
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Send alert when someone submits a contact form
                      </p>
                    </div>
                    <Switch
                      checked={settings.notify_on_contact.value}
                      onCheckedChange={() => toggleSetting("notify_on_contact")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        Failed Email Deliveries
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Send alert when an email fails to deliver
                      </p>
                    </div>
                    <Switch
                      checked={settings.notify_on_failed.value}
                      onCheckedChange={() => toggleSetting("notify_on_failed")}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-warning" />
                        Email Bounces
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Send alert when an email bounces
                      </p>
                    </div>
                    <Switch
                      checked={settings.notify_on_bounce.value}
                      onCheckedChange={() => toggleSetting("notify_on_bounce")}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Daily Digest */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Daily Digest
                  </CardTitle>
                  <CardDescription>
                    Receive a daily summary of all contact submissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Daily Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Get a daily email with submission summary
                      </p>
                    </div>
                    <Switch
                      checked={settings.daily_digest_enabled.value}
                      onCheckedChange={() => toggleSetting("daily_digest_enabled")}
                    />
                  </div>

                  {settings.daily_digest_enabled.value && (
                    <div className="space-y-2">
                      <Label>Delivery Time</Label>
                      <Input
                        type="time"
                        value={settings.daily_digest_time.value}
                        onChange={(e) => updateDigestTime(e.target.value)}
                        className="w-40"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={saveSettings}
                disabled={isSaving}
                className="w-full"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
