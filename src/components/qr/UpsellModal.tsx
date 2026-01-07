import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown, Check, Sparkles } from "lucide-react";

interface UpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
}

const proFeatures = [
  "50 QR codes",
  "WiFi, vCard, Event & Location types",
  "Basic scan tracking",
  "Analytics dashboard",
  "Custom colors & branding",
  "Dynamic QR codes",
];

export function UpsellModal({ open, onOpenChange, feature }: UpsellModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="font-display text-2xl">
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-base">
            {feature} is a premium feature. Upgrade to unlock it and more!
          </DialogDescription>
        </DialogHeader>

        <div className="my-6">
          <div className="flex items-baseline justify-center gap-1 mb-4">
            <span className="text-4xl font-display font-bold">R179</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <ul className="space-y-3">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-success" />
                </div>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="hero" size="lg" className="w-full" asChild>
            <Link to="/dashboard/settings">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade Now
            </Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
