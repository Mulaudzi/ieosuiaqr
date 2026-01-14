import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface SMSData {
  phoneNumber: string;
  message: string;
}

interface SMSFormProps {
  data: SMSData;
  onChange: (data: SMSData) => void;
}

export function SMSForm({ data, onChange }: SMSFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sms-phone">Phone Number *</Label>
        <Input
          id="sms-phone"
          type="tel"
          placeholder="+27 12 345 6789"
          value={data.phoneNumber}
          onChange={(e) => onChange({ ...data, phoneNumber: e.target.value })}
          aria-required="true"
        />
        <p className="text-xs text-muted-foreground">
          Include country code for international numbers
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sms-message">Message (optional)</Label>
        <Textarea
          id="sms-message"
          placeholder="Pre-fill the SMS with a message..."
          rows={3}
          value={data.message}
          onChange={(e) => onChange({ ...data, message: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          This message will be pre-filled when the user scans
        </p>
      </div>
    </div>
  );
}

export function generateSMSString(data: SMSData): string {
  const phone = data.phoneNumber.replace(/\s/g, "");
  if (data.message) {
    return `sms:${phone}?body=${encodeURIComponent(data.message)}`;
  }
  return `sms:${phone}`;
}
