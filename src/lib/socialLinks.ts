export type SocialLink = { platform?: string; url?: string };

const platformBases: Record<string, (handle: string) => string> = {
  facebook: (handle) => `https://facebook.com/${handle}`,
  instagram: (handle) => `https://instagram.com/${handle}`,
  twitter: (handle) => `https://x.com/${handle}`,
  x: (handle) => `https://x.com/${handle}`,
  linkedin: (handle) => `https://linkedin.com/in/${handle}`,
  youtube: (handle) => `https://youtube.com/@${handle}`,
  tiktok: (handle) => `https://tiktok.com/@${handle}`,
  pinterest: (handle) => `https://pinterest.com/${handle}`,
  snapchat: (handle) => `https://snapchat.com/add/${handle}`,
};

export function normalizeSocialUrl(platform: string, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const webValue = /^www\./i.test(trimmed) ? `https://${trimmed}` : trimmed;
  try {
    const parsed = new URL(webValue);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.toString();
  } catch {
    // A handle is also accepted for known social platforms.
  }

  const normalizedPlatform = platform.trim().toLowerCase();
  const builder = platformBases[normalizedPlatform];
  if (!builder) return null;
  const handle = trimmed.replace(/^@/, "").replace(/\s+/g, "").replace(/^\/+|\/+$/g, "");
  return handle ? builder(encodeURIComponent(handle)) : null;
}

export function parseSocialLinks(content: unknown): Array<Required<SocialLink> & { href: string | null }> {
  if (!content || typeof content !== "object" || Array.isArray(content)) return [];
  const raw = (content as { links?: unknown }).links;
  let links: SocialLink[] = [];

  if (Array.isArray(raw)) links = raw as SocialLink[];
  else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) links = parsed as SocialLink[];
    } catch {
      return [];
    }
  }

  return links
    .filter((link) => typeof link?.url === "string" && link.url.trim())
    .map((link) => ({
      platform: link.platform?.trim() || "Link",
      url: link.url!.trim(),
      href: normalizeSocialUrl(link.platform || "other", link.url!),
    }));
}
