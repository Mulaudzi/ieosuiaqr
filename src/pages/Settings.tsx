import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { AvatarCropper } from "@/components/profile/AvatarCropper";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Lock,
  Bell,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Camera,
  Shield,
  Calendar,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default function Settings() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const { toast } = useToast();
  const { user, updateUser } = useAuth();

  const handleAvatarUpload = async (croppedImage: Blob) => {
    setIsUploadingAvatar(true);
    try {
      const response = await authApi.uploadAvatar(croppedImage);
      if (response.success && response.data && user) {
        updateUser({ ...user, avatar_url: response.data.avatar_url });
        toast({ title: "Avatar updated", description: "Your profile photo has been updated successfully." });
        setShowAvatarCropper(false);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({ variant: "destructive", title: "Upload failed", description: err.message || "Failed to upload avatar." });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setIsLoadingProfile(false);
    }
  }, [user]);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleProfileSave = async () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter your name.",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await authApi.updateProfile({ name, email });
      if (response.success && response.data) {
        updateUser(response.data);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
      }
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 409) {
        toast({
          variant: "destructive",
          title: "Email already in use",
          description: "This email address is already associated with another account.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: err.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast({
        variant: "destructive",
        title: "Current password required",
        description: "Please enter your current password.",
      });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: passwordError,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please make sure your new passwords match.",
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await authApi.updateProfile({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (response.success) {
        toast({
          title: "Password changed",
          description: "Your password has been updated successfully.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message || "Could not update password.",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="pb-24 lg:ml-64 lg:pb-0">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-4 py-3 sm:px-6 sm:py-4">
            <h1 className="font-display text-xl sm:text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>
        </header>

        <div className="p-4 sm:p-6 w-full">
          <Tabs defaultValue="profile" className="w-full max-w-4xl mx-auto">
            <TabsList className="mb-6 grid h-auto w-full grid-cols-3">
              <TabsTrigger value="profile" className="gap-1 px-2 sm:gap-2 sm:px-3">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1 px-2 sm:gap-2 sm:px-3">
                <Lock className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1 px-2 sm:gap-2 sm:px-3">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="relative group shrink-0">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-24 h-24 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <span className="text-3xl font-display font-bold text-primary">
                            {user?.name ? user.name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2) : "U"}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label="Change profile photo"
                        onClick={() => setShowAvatarCropper(true)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      >
                        <Camera className="w-6 h-6 text-white" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <h2 className="font-display text-xl font-bold">{user?.name || "User"}</h2>
                      <p className="text-muted-foreground">{user?.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant={user?.email_verified_at ? "default" : "secondary"}>
                          <Shield className="w-3 h-3 mr-1" />
                          {user?.email_verified_at ? "Verified" : "Unverified"}
                        </Badge>
                        <Badge variant="outline">Free Forever</Badge>
                        <Badge variant="outline">
                          <Calendar className="w-3 h-3 mr-1" />
                          {user?.created_at
                            ? `Member since ${new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
                            : "Recently joined"}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAvatarCropper(true)}>
                        <Camera className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h3 className="font-display font-semibold mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </div>

                    <Button variant="hero" onClick={handleProfileSave} disabled={isSavingProfile || isLoadingProfile}>
                      {isSavingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="security">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h3 className="font-display font-semibold mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <Button variant="hero" onClick={handlePasswordChange} disabled={isSavingPassword}>
                      {isSavingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </div>
                </div>

                {newPassword && (
                  <div className="p-4 rounded-xl bg-muted/50">
                    <PasswordStrengthIndicator password={newPassword} />
                  </div>
                )}

                <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20">
                  <h3 className="font-display font-semibold text-destructive mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account and all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={async () => {
                            try {
                              await authApi.deleteAccount(currentPassword || "");
                              localStorage.clear();
                              toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
                              navigate("/login");
                            } catch {
                              toast({ variant: "destructive", title: "Error", description: "Failed to delete account. Please try again." });
                            }
                          }}
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationSettings />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AvatarCropper
        open={showAvatarCropper}
        onClose={() => setShowAvatarCropper(false)}
        onCropComplete={handleAvatarUpload}
        isUploading={isUploadingAvatar}
      />

    </div>
  );
}
