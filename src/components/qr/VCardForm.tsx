import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface VCardData {
  fullName: string;
  phone: string;
  email: string;
  organization: string;
  title: string;
  address: string;
  website: string;
}

interface VCardFormProps {
  data: VCardData;
  onChange: (data: VCardData) => void;
}

export function VCardForm({ data, onChange }: VCardFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            placeholder="John Doe"
            value={data.fullName}
            onChange={(e) => onChange({ ...data, fullName: e.target.value })}
            aria-required="true"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vcard-phone">Phone</Label>
          <Input
            id="vcard-phone"
            type="tel"
            placeholder="+27 12 345 6789"
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vcard-email">Email</Label>
          <Input
            id="vcard-email"
            type="email"
            placeholder="john@example.com"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://example.com"
            value={data.website}
            onChange={(e) => onChange({ ...data, website: e.target.value })}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="organization">Organization</Label>
          <Input
            id="organization"
            placeholder="Company Name"
            value={data.organization}
            onChange={(e) => onChange({ ...data, organization: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Job Title</Label>
          <Input
            id="title"
            placeholder="Software Engineer"
            value={data.title}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          placeholder="123 Main Street, City, Country"
          value={data.address}
          onChange={(e) => onChange({ ...data, address: e.target.value })}
          rows={2}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Scanning this QR code will save your contact information to the user's phone.
      </p>
    </div>
  );
}

export function generateVCardString(data: VCardData): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${data.fullName}`,
  ];

  if (data.phone) lines.push(`TEL:${data.phone}`);
  if (data.email) lines.push(`EMAIL:${data.email}`);
  if (data.organization) lines.push(`ORG:${data.organization}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.address) lines.push(`ADR:;;${data.address.replace(/\n/g, ";")}`);
  if (data.website) lines.push(`URL:${data.website}`);

  lines.push("END:VCARD");
  return lines.join("\n");
}
