import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/api/auth";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useToast } from "@/hooks/use-toast";
import { AvatarCropper } from "@/components/profile/AvatarCropper";
import {
  QrCode,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  Crown,
  User,
  Mail,
  Calendar,
  Shield,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Camera,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { plan: currentPlan } = useUserPlan();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleAvatarUpload = async (croppedImage: Blob) => {
    setIsUploadingAvatar(true);
    try {
      const response = await authApi.uploadAvatar(croppedImage);
      if (response.success && response.data) {
        updateUser({ ...user!, avatar_url: response.data.avatar_url });
        toast({
          title: "Avatar updated",
          description: "Your profile photo has been updated successfully.",
        });
        setShowAvatarCropper(false);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err.message || "Failed to upload avatar. Please try again.",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };


  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      // Error handled by logout
    }
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSavingProfile(false);
    }
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

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: "Password must be at least 8 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
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
      const err = error as { status?: number; message?: string };
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      {/* Main Content */}
      <main className="lg:ml-64">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">My Profile</h1>
              <p className="text-sm text-muted-foreground">
                Manage your personal information
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </header>

        <div className="p-6 max-w-4xl">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-card border border-border mb-6"
          >
            <div className="flex items-start gap-6 mb-6">
              <div className="relative group">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="text-3xl font-display font-bold text-primary">
                      {user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U"}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowAvatarCropper(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold">{user?.name || "User"}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={user?.email_verified_at ? "default" : "secondary"}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user?.email_verified_at ? "Verified" : "Unverified"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    <Crown className="w-3 h-3 mr-1" />
                    {currentPlan} Plan
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setShowAvatarCropper(true)}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Change Photo
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Member Since</p>
                  <p className="font-medium">Recently Joined</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Edit Profile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-card border border-border mb-6"
          >
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Edit Profile
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <Button variant="hero" onClick={handleProfileSave} disabled={isSavingProfile}>
              {isSavingProfile ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {isSavingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </motion.div>

          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-card border border-border"
          >
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </h3>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              <Button variant="outline" onClick={handlePasswordChange} disabled={isSavingPassword}>
                {isSavingPassword ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4 mr-2" />
                )}
                {isSavingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Avatar Cropper Modal */}
      <AvatarCropper
        open={showAvatarCropper}
        onClose={() => setShowAvatarCropper(false)}
        onCropComplete={handleAvatarUpload}
        isUploading={isUploadingAvatar}
      />
    </div>
  );
}
