import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface WhatsAppData {
  phoneNumber: string;
  message: string;
}

interface WhatsAppFormProps {
  data: WhatsAppData;
  onChange: (data: WhatsAppData) => void;
}

export function WhatsAppForm({ data, onChange }: WhatsAppFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="wa-phone">Phone Number *</Label>
        <Input
          id="wa-phone"
          type="tel"
          placeholder="+27 12 345 6789"
          value={data.phoneNumber}
          onChange={(e) => onChange({ ...data, phoneNumber: e.target.value })}
          aria-required="true"
        />
        <p className="text-xs text-muted-foreground">
          Include country code (e.g., +27 for South Africa)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wa-message">Message (optional)</Label>
        <Textarea
          id="wa-message"
          placeholder="Pre-fill the chat with a message..."
          rows={3}
          value={data.message}
          onChange={(e) => onChange({ ...data, message: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          This message will appear when the user opens the chat
        </p>
      </div>
    </div>
  );
}

export function generateWhatsAppString(data: WhatsAppData): string {
  // Remove spaces and special characters, keep + for country code
  const phone = data.phoneNumber.replace(/[\s()-]/g, "").replace(/^\+/, "");
  if (data.message) {
    return `https://wa.me/${phone}?text=${encodeURIComponent(data.message)}`;
  }
  return `https://wa.me/${phone}`;
}
