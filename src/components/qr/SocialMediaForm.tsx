import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export interface SocialMediaData {
  links: { platform: string; url: string }[];
}

const platforms = [
  { id: "facebook", name: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { id: "instagram", name: "Instagram", placeholder: "https://instagram.com/yourusername" },
  { id: "twitter", name: "X (Twitter)", placeholder: "https://x.com/yourusername" },
  { id: "linkedin", name: "LinkedIn", placeholder: "https://linkedin.com/in/yourprofile" },
  { id: "youtube", name: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  { id: "tiktok", name: "TikTok", placeholder: "https://tiktok.com/@yourusername" },
  { id: "pinterest", name: "Pinterest", placeholder: "https://pinterest.com/yourusername" },
  { id: "snapchat", name: "Snapchat", placeholder: "https://snapchat.com/add/yourusername" },
  { id: "other", name: "Other", placeholder: "https://..." },
];

interface SocialMediaFormProps {
  data: SocialMediaData;
  onChange: (data: SocialMediaData) => void;
}

export function SocialMediaForm({ data, onChange }: SocialMediaFormProps) {
  const addLink = () => {
    if (data.links.length >= 5) return;
    onChange({
      links: [...data.links, { platform: "", url: "" }],
    });
  };

  const removeLink = (index: number) => {
    const newLinks = data.links.filter((_, i) => i !== index);
    onChange({ links: newLinks });
  };

  const updateLink = (index: number, field: "platform" | "url", value: string) => {
    const newLinks = [...data.links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onChange({ links: newLinks });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Social Media Links</Label>
        <span className="text-xs text-muted-foreground">{data.links.length}/5 links</span>
      </div>

      {data.links.map((link, index) => (
        <div key={index} className="flex gap-2 items-start">
          <div className="flex-1 space-y-2">
            <select
              value={link.platform}
              onChange={(e) => updateLink(index, "platform", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Select platform...</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Input
              placeholder={
                platforms.find((p) => p.id === link.platform)?.placeholder || "https://..."
              }
              value={link.url}
              onChange={(e) => updateLink(index, "url", e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeLink(index)}
            className="mt-1"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ))}

      {data.links.length < 5 && (
        <Button variant="outline" onClick={addLink} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Social Link
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Add up to 5 social media profiles. Users will see a page with all your links.
      </p>
    </div>
  );
}

export function generateSocialMediaString(data: SocialMediaData): string {
  // For multiple links, we'd create a landing page
  // For now, return the first valid URL
  const firstValidLink = data.links.find((l) => l.url);
  return firstValidLink?.url || "";
}
