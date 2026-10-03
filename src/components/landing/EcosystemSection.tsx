import type { LucideIcon } from "lucide-react";
import { Blocks, Bot, FileText, Globe2, MessageSquareText, Palette, PanelsTopLeft, QrCode, Smartphone, Sparkles, Workflow } from "lucide-react";

type Product = { name: string; description: string; href: string; icon: LucideIcon; current?: boolean };

const products: Product[] = [
  { name: "IEOSUIA QR", description: "Create, update, and track smart QR codes.", href: "https://qr.ieosuia.com/", icon: QrCode, current: true },
  { name: "IEOSUIA Invoices", description: "Create professional invoices, quotes, and track payments.", href: "https://invoices.ieosuia.com/", icon: FileText },
  { name: "IEOSUIA SMS Portal", description: "Manage audiences, send SMS campaigns, and monitor delivery.", href: "https://sms.ieosuia.com/", icon: MessageSquareText },
];

const services: Array<{ name: string; icon: LucideIcon }> = [
  { name: "Websites", icon: Globe2 }, { name: "Mobile Apps", icon: Smartphone },
  { name: "Business Software", icon: Blocks }, { name: "AI Solutions", icon: Bot },
  { name: "Automation", icon: Workflow }, { name: "Graphic Design", icon: Palette },
  { name: "UI/UX Design", icon: PanelsTopLeft }, { name: "Animation & Motion", icon: Sparkles },
];

export function EcosystemSection() {
  return (
    <section aria-labelledby="ecosystem-heading" className="relative overflow-hidden border-t border-slate-800 bg-[#061a2d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(20,184,166,0.16),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(37,99,235,0.18),transparent_34%)]" />
      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="max-w-3xl"><p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300"><Sparkles className="h-4 w-4" />The IEOSUIA ecosystem</p><h2 id="ecosystem-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">More tools. More services. One IEOSUIA ecosystem.</h2><p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">Looking for more than QR codes? Discover other IEOSUIA tools and service capabilities built to help businesses work smarter.</p></div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {products.map(({ name, description, href, icon: Icon, current }) => {
            const content = <><div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-teal-400/20 to-blue-500/20 text-cyan-200 ring-1 ring-white/10"><Icon className="h-5 w-5" /></span>{current && <span className="rounded-full bg-cyan-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-950">Current product</span>}</div><h3 className="mt-6 text-lg font-semibold">{name}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{description}</p></>;
            const classes = `group rounded-2xl border p-5 transition ${current ? "border-cyan-300/50 bg-cyan-300/[0.08] shadow-[0_18px_50px_rgba(8,145,178,0.14)]" : "border-white/10 bg-white/[0.04] hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"}`;
            return current ? <article key={name} className={classes}>{content}</article> : <a key={name} href={href} aria-label={`Explore ${name}`} className={classes}>{content}</a>;
          })}
        </div>
        <div className="mt-10 border-t border-white/10 pt-8"><h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Digital services</h3><div className="mt-4 flex flex-wrap gap-2.5">{services.map(({ name, icon: Icon }) => <span key={name} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200"><Icon className="h-4 w-4 text-cyan-300" />{name}</span>)}</div></div>
      </div>
    </section>
  );
}
