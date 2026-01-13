import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, Check, Copy, QrCode } from "lucide-react";
import { post } from "@/services/api/client";
import { QRCodeSVG } from "qrcode.react";

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Enable2FAResponse {
  success: boolean;
  data?: {
    secret: string;
    qr_code_url: string;
  };
  message?: string;
}

export function TwoFactorSetup({ open, onOpenChange, onSuccess }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"init" | "verify">("init");
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const response = await post<Enable2FAResponse>("/user/2fa/enable");
      
      if (response.success && response.data) {
        setSecret(response.data.secret);
        setQrCodeUrl(response.data.qr_code_url);
        setStep("verify");
      } else {
        throw new Error(response.message || "Failed to enable 2FA");
      }
    } catch (error) {
      console.error("2FA setup error:", error);
      toast({
        variant: "destructive",
        title: "Setup failed",
        description: "Could not initialize 2FA. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter a 6-digit verification code.",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await post<{ success: boolean; message?: string }>("/user/2fa/verify", {
        code: verificationCode,
        secret: secret,
      });

      if (response.success) {
        toast({
          title: "2FA Enabled!",
          description: "Two-factor authentication is now active on your account.",
        });
        onSuccess?.();
        handleClose();
      } else {
        throw new Error(response.message || "Verification failed");
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Invalid code. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setStep("init");
    setSecret("");
    setQrCodeUrl("");
    setVerificationCode("");
    onOpenChange(false);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({
      title: "Copied!",
      description: "Secret key copied to clipboard.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-success" />
            {step === "init" ? "Enable Two-Factor Authentication" : "Verify Your Setup"}
          </DialogTitle>
          <DialogDescription>
            {step === "init"
              ? "Add an extra layer of security to your account."
              : "Scan the QR code with your authenticator app, then enter the code."}
          </DialogDescription>
        </DialogHeader>

        {step === "init" ? (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h4 className="font-medium">You'll need:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  An authenticator app (Google Authenticator, Authy, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  A few minutes to complete setup
                </li>
              </ul>
            </div>

            <Button
              variant="hero"
              className="w-full"
              onClick={handleSetup}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Start Setup
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-xl">
                <QRCodeSVG value={qrCodeUrl} size={180} level="M" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Scan this QR code with your authenticator app
              </p>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Or enter this key manually:
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded font-mono text-sm break-all">
                  {secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Verification Input */}
            <div className="space-y-2">
              <Label htmlFor="verification-code">Enter verification code</Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="hero"
                onClick={handleVerify}
                disabled={isVerifying || verificationCode.length !== 6}
                className="flex-1"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Enable"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
