import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { post } from "@/services/api/client";
import { Shield, Smartphone, Loader2, Copy, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface TwoFactorSetupProps {
  onComplete?: () => void;
}

export function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      const response = await post<{
        success: boolean;
        data: { secret: string; qr_code_url: string };
        message: string;
      }>("/user/2fa/enable", {});

      if (response.success && response.data) {
        setSecret(response.data.secret);
        setQrCodeUrl(response.data.qr_code_url);
        setStep("setup");
        setIsDialogOpen(true);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to initialize 2FA setup.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsEnabling(true);
    try {
      const response = await post<{ success: boolean; message: string }>(
        "/user/2fa/verify",
        { code: verificationCode, secret }
      );

      if (response.success) {
        toast({
          title: "2FA enabled",
          description: "Two-factor authentication is now active on your account.",
        });
        await refreshUser();
        setIsDialogOpen(false);
        setStep("setup");
        setVerificationCode("");
        onComplete?.();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Verification failed",
        description: err.message || "Invalid code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Secret key copied to clipboard.",
    });
  };

  const handleDisable2FA = async () => {
    setIsLoading(true);
    try {
      const response = await post<{ success: boolean; message: string }>(
        "/user/2fa/disable",
        {}
      );

      if (response.success) {
        toast({
          title: "2FA disabled",
          description: "Two-factor authentication has been turned off.",
        });
        await refreshUser();
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to disable 2FA.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="p-6 rounded-2xl bg-card border border-border">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold mb-1">
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add an extra layer of security to your account by requiring a verification code from your authenticator app.
            </p>
            <Button
              onClick={handleEnable2FA}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              Enable 2FA
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-white border border-border">
                {qrCodeUrl ? (
                  <QRCodeSVG value={qrCodeUrl} size={180} level="M" />
                ) : (
                  <div className="w-[180px] h-[180px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Manual entry */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Or enter this code manually:
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className="px-3 py-2 rounded-lg bg-muted font-mono text-sm">
                  {secret}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopySecret}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Verification */}
            <div className="space-y-2">
              <Label htmlFor="code">Enter verification code</Label>
              <Input
                id="code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <Button
              variant="hero"
              className="w-full"
              onClick={handleVerify}
              disabled={isEnabling || verificationCode.length !== 6}
            >
              {isEnabling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Enable 2FA"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
