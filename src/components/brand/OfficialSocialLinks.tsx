import type { SVGProps } from "react";
import { Facebook, Instagram } from "lucide-react";

const OFFICIAL_IEOSUIA_SOCIAL_LINKS = [
  { label: "IEOSUIA on Instagram", href: "https://www.instagram.com/ieosuia_official/", icon: Instagram },
  { label: "IEOSUIA on Facebook", href: "https://www.facebook.com/ieosuia/", icon: Facebook },
  { label: "IEOSUIA on TikTok", href: "https://www.tiktok.com/@ieosuia", icon: TikTokIcon },
] as const;

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.1 2h3.1c.2 1.8 1.2 3.4 2.8 4.3v3.2a9.1 9.1 0 0 1-2.8-.9v6.1a7 7 0 1 1-6-6.9v3.3a3.8 3.8 0 1 0 2.9 3.6V2Z" />
    </svg>
  );
}

export function OfficialSocialLinks() {
  return (
    <div className="mt-6 flex gap-2" aria-label="Official IEOSUIA social media">
      {OFFICIAL_IEOSUIA_SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
        <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
