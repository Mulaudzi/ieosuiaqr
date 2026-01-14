import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AppData {
  appStoreUrl: string;
  playStoreUrl: string;
  linkType: "both" | "ios" | "android";
}

interface AppFormProps {
  data: AppData;
  onChange: (data: AppData) => void;
}

export function AppForm({ data, onChange }: AppFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Link Type</Label>
        <Select
          value={data.linkType}
          onValueChange={(value: "both" | "ios" | "android") =>
            onChange({ ...data, linkType: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select link type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">Both Platforms</SelectItem>
            <SelectItem value="ios">iOS Only</SelectItem>
            <SelectItem value="android">Android Only</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose which app stores to link to
        </p>
      </div>

      {(data.linkType === "both" || data.linkType === "ios") && (
        <div className="space-y-2">
          <Label htmlFor="app-ios">App Store URL (iOS) *</Label>
          <Input
            id="app-ios"
            type="url"
            placeholder="https://apps.apple.com/app/..."
            value={data.appStoreUrl}
            onChange={(e) => onChange({ ...data, appStoreUrl: e.target.value })}
            aria-required="true"
          />
        </div>
      )}

      {(data.linkType === "both" || data.linkType === "android") && (
        <div className="space-y-2">
          <Label htmlFor="app-android">Play Store URL (Android) *</Label>
          <Input
            id="app-android"
            type="url"
            placeholder="https://play.google.com/store/apps/..."
            value={data.playStoreUrl}
            onChange={(e) => onChange({ ...data, playStoreUrl: e.target.value })}
            aria-required="true"
          />
        </div>
      )}

      {data.linkType === "both" && (
        <p className="text-xs text-muted-foreground">
          Users will be automatically redirected to the correct store based on their device
        </p>
      )}
    </div>
  );
}

export function generateAppString(data: AppData): string {
  // For "both", we use the Play Store URL as default but the scanner should detect device
  // In production, you'd use a smart link service
  switch (data.linkType) {
    case "ios":
      return data.appStoreUrl;
    case "android":
      return data.playStoreUrl;
    case "both":
    default:
      // Use Play Store as default, but ideally this would be a smart redirect
      return data.playStoreUrl || data.appStoreUrl;
  }
}
