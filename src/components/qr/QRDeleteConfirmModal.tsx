import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { StoredQRCode } from "@/hooks/useQRStorage";

interface QRDeleteConfirmModalProps {
  qrCode: StoredQRCode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
}

export function QRDeleteConfirmModal({
  qrCode,
  open,
  onOpenChange,
  onConfirm,
}: QRDeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!qrCode) return;
    setIsDeleting(true);
    try {
      await onConfirm(qrCode.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!qrCode) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete QR Code?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{qrCode.name}"? This action cannot be
            undone and all scan data will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
