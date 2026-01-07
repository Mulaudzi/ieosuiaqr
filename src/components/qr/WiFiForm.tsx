import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface WiFiData {
  ssid: string;
  password: string;
  encryption: "nopass" | "WEP" | "WPA";
}

interface WiFiFormProps {
  data: WiFiData;
  onChange: (data: WiFiData) => void;
}

export function WiFiForm({ data, onChange }: WiFiFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ssid">Network Name (SSID) *</Label>
        <Input
          id="ssid"
          placeholder="MyWiFiNetwork"
          value={data.ssid}
          onChange={(e) => onChange({ ...data, ssid: e.target.value })}
          aria-required="true"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="encryption">Encryption Type *</Label>
        <Select
          value={data.encryption}
          onValueChange={(value: WiFiData["encryption"]) =>
            onChange({ ...data, encryption: value })
          }
        >
          <SelectTrigger id="encryption" aria-label="Select encryption type">
            <SelectValue placeholder="Select encryption" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WPA">WPA/WPA2</SelectItem>
            <SelectItem value="WEP">WEP</SelectItem>
            <SelectItem value="nopass">None (Open)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.encryption !== "nopass" && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter WiFi password"
            value={data.password}
            onChange={(e) => onChange({ ...data, password: e.target.value })}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Scanning this QR code will allow users to connect to your WiFi network automatically.
      </p>
    </div>
  );
}

export function generateWiFiString(data: WiFiData): string {
  const escapedSSID = data.ssid.replace(/[\\;,"]/g, "\\$&");
  const escapedPassword = data.password.replace(/[\\;,"]/g, "\\$&");
  return `WIFI:T:${data.encryption};S:${escapedSSID};P:${escapedPassword};;`;
}
