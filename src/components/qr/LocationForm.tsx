import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface LocationData {
  latitude: string;
  longitude: string;
  address: string;
  inputMode: "coordinates" | "address";
}

interface LocationFormProps {
  data: LocationData;
  onChange: (data: LocationData) => void;
}

export function LocationForm({ data, onChange }: LocationFormProps) {
  return (
    <div className="space-y-4">
      <Tabs
        value={data.inputMode}
        onValueChange={(value) =>
          onChange({ ...data, inputMode: value as LocationData["inputMode"] })
        }
      >
        <TabsList className="w-full">
          <TabsTrigger value="coordinates" className="flex-1">
            Coordinates
          </TabsTrigger>
          <TabsTrigger value="address" className="flex-1">
            Address
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coordinates" className="space-y-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="-25.7479"
                value={data.latitude}
                onChange={(e) => onChange({ ...data, latitude: e.target.value })}
                min="-90"
                max="90"
                aria-required="true"
              />
              <p className="text-xs text-muted-foreground">-90 to 90</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="28.2293"
                value={data.longitude}
                onChange={(e) => onChange({ ...data, longitude: e.target.value })}
                min="-180"
                max="180"
                aria-required="true"
              />
              <p className="text-xs text-muted-foreground">-180 to 180</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="address" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="location-address">Address *</Label>
            <Input
              id="location-address"
              placeholder="123 Main Street, Johannesburg, South Africa"
              value={data.address}
              onChange={(e) => onChange({ ...data, address: e.target.value })}
              aria-required="true"
            />
            <p className="text-xs text-muted-foreground">
              Enter a full address. Note: For best results, use coordinates directly.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/50 border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              💡 For production, this will use geocoding to convert the address to coordinates.
              Currently using the address text as a Google Maps search link.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Scanning this QR code will open the location in the user's maps application.
      </p>
    </div>
  );
}

export function generateLocationString(data: LocationData): string {
  if (data.inputMode === "coordinates" && data.latitude && data.longitude) {
    return `geo:${data.latitude},${data.longitude}`;
  }
  // Fallback to Google Maps search link for address
  if (data.address) {
    return `https://maps.google.com/?q=${encodeURIComponent(data.address)}`;
  }
  return "geo:0,0";
}
