import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/hooks/useAdminSession";
import { adminApi, AdminUser } from "@/services/api/admin";
import {
  Users,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  ShieldOff,
  Unlock,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminUsers() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword1, setEditPassword1] = useState("");
  const [editPassword2, setEditPassword2] = useState("");
  const [editPassword3, setEditPassword3] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isValidSession, isChecking, clearAdminSession } = useAdminSession();

  useEffect(() => {
    // Only redirect if session check is complete and explicitly invalid
    if (!isChecking && isValidSession === false) {
      navigate("/login", { state: { adminRedirect: true }, replace: true });
    }
  }, [isChecking, isValidSession, navigate]);

  useEffect(() => {
    if (isValidSession) {
      fetchAdmins();
    }
  }, [isValidSession]);

  const fetchAdmins = async () => {
    try {
      const response = await adminApi.listAdmins();
      if (response.success && response.data) {
        setAdmins(response.data.admins);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load admin users"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    try {
      const response = await adminApi.toggleAdminStatus(admin.id);
      if (response.success) {
        toast({
          title: response.data?.is_active ? "Admin Activated" : "Admin Deactivated",
          description: `${admin.name} has been ${response.data?.is_active ? "activated" : "deactivated"}.`
        });
        fetchAdmins();
      }
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      toast({
        variant: "destructive",
        title: "Error",
        description: apiError.message || "Failed to toggle status"
      });
    }
  };

  const handleUnlock = async (admin: AdminUser) => {
    try {
      await adminApi.unlockAdmin(admin.id);
      toast({
        title: "Account Unlocked",
        description: `${admin.name}'s account has been unlocked.`
      });
      fetchAdmins();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      toast({
        variant: "destructive",
        title: "Error",
        description: apiError.message || "Failed to unlock account"
      });
    }
  };

  const openEditDialog = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditName(admin.name);
    setEditEmail(admin.email);
    setEditPassword1("");
    setEditPassword2("");
    setEditPassword3("");
    setShowPasswords(false);
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!selectedAdmin) return;
    
    setIsSubmitting(true);
    try {
      const updateData: Record<string, string> = {};
      
      if (editName !== selectedAdmin.name) {
        updateData.name = editName;
      }
      if (editEmail !== selectedAdmin.email) {
        updateData.email = editEmail;
      }
      if (editPassword1) {
        updateData.password1 = editPassword1;
      }
      if (editPassword2) {
        updateData.password2 = editPassword2;
      }
      if (editPassword3) {
        updateData.password3 = editPassword3;
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: "No Changes",
          description: "No fields were modified."
        });
        setShowEditDialog(false);
        return;
      }

      await adminApi.updateAdmin(selectedAdmin.id, updateData);
      toast({
        title: "Admin Updated",
        description: `${editName} has been updated successfully.`
      });
      setShowEditDialog(false);
      fetchAdmins();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      toast({
        variant: "destructive",
        title: "Error",
        description: apiError.message || "Failed to update admin"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    
    setIsSubmitting(true);
    try {
      await adminApi.deleteAdmin(selectedAdmin.id);
      toast({
        title: "Admin Deleted",
        description: `${selectedAdmin.name} has been permanently deleted.`
      });
      setShowDeleteDialog(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      toast({
        variant: "destructive",
        title: "Error",
        description: apiError.message || "Failed to delete admin"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <AdminBreadcrumb />
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Admin Users
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage administrator accounts and permissions
            </p>
          </div>
          <Button onClick={() => navigate("/admin/create")}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </div>

        {/* Admin List */}
        <Card>
          <CardHeader>
            <CardTitle>All Administrators</CardTitle>
            <CardDescription>
              {admins.length} admin user{admins.length !== 1 ? "s" : ""} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Failed Attempts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {admin.is_active ? (
                          <Badge variant="outline" className="bg-success/10 text-success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                        {admin.locked_until && new Date(admin.locked_until) > new Date() && (
                          <Badge variant="outline" className="bg-warning/10 text-warning">
                            <Clock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {admin.last_login_at 
                        ? format(new Date(admin.last_login_at), "MMM d, yyyy h:mm a")
                        : "Never"
                      }
                    </TableCell>
                    <TableCell>
                      <span className={admin.failed_attempts > 0 ? "text-warning font-medium" : ""}>
                        {admin.failed_attempts}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(admin)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(admin)}>
                            {admin.is_active ? (
                              <>
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          {(admin.failed_attempts > 0 || admin.locked_until) && (
                            <DropdownMenuItem onClick={() => handleUnlock(admin)}>
                              <Unlock className="w-4 h-4 mr-2" />
                              Unlock Account
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Admin User</DialogTitle>
              <DialogDescription>
                Update admin details and passwords
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">
                    Update Passwords (leave blank to keep current)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-pw1">Password 1 (min 8 chars)</Label>
                  <Input
                    id="edit-pw1"
                    type={showPasswords ? "text" : "password"}
                    value={editPassword1}
                    onChange={(e) => setEditPassword1(e.target.value)}
                    placeholder="Leave blank to keep current"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-pw2">Password 2 (min 6 chars)</Label>
                  <Input
                    id="edit-pw2"
                    type={showPasswords ? "text" : "password"}
                    value={editPassword2}
                    onChange={(e) => setEditPassword2(e.target.value)}
                    placeholder="Leave blank to keep current"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-pw3">Password 3 (min 6 chars)</Label>
                  <Input
                    id="edit-pw3"
                    type={showPasswords ? "text" : "password"}
                    value={editPassword3}
                    onChange={(e) => setEditPassword3(e.target.value)}
                    placeholder="Leave blank to keep current"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Admin User</DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete {selectedAdmin?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will permanently remove the admin account and all associated data.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
