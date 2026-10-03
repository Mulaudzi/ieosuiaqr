import { Link } from "react-router-dom";
import { IEOSUIAQrLogo } from "@/components/brand/IEOSUIAQrLogo";
import { OfficialSocialLinks } from "@/components/brand/OfficialSocialLinks";

const groups = [
  { title: "Product", links: [{ name: "Features", href: "/features" }, { name: "Pricing", href: "/pricing" }, { name: "Get started", href: "/signup" }] },
  { title: "Solutions", links: [{ name: "All solutions", href: "/solutions" }, { name: "Dynamic QR codes", href: "/dynamic-qr-codes" }, { name: "Inventory QR codes", href: "/inventory-qr-codes" }] },
  { title: "Resources", links: [{ name: "Documentation", href: "/docs" }, { name: "FAQ", href: "/faq" }, { name: "Support", href: "/support" }, { name: "Contact", href: "/contact" }] },
  { title: "Company", links: [{ name: "About IEOSUIA", href: "https://www.ieosuia.com", external: true }, { name: "Careers", href: "/careers" }] },
  { title: "Legal", links: [{ name: "Privacy", href: "/privacy" }, { name: "Terms", href: "/terms" }, { name: "Cookies", href: "/cookies" }] },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-100/90">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1.85fr]">
          <div>
            <Link to="/" className="inline-flex"><IEOSUIAQrLogo variant="footer" className="w-[205px] sm:w-[230px]" /></Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-600">Create, manage, update, and track branded QR codes—with inventory tools when the code represents something physical.</p>
            <OfficialSocialLinks />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-5">
            {groups.map(group => <div key={group.title}><h3 className="text-sm font-semibold text-slate-950">{group.title}</h3><ul className="mt-4 space-y-3">{group.links.map(link => <li key={link.name}>{"external" in link && link.external ? <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 transition hover:text-slate-950">{link.name}</a> : <Link to={link.href} className="text-sm text-slate-600 transition hover:text-slate-950">{link.name}</Link>}</li>)}</ul></div>)}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} IEOSUIA QR. All rights reserved.</p><p>A focused QR Codes product by IEOSUIA.</p></div>
      </div>
    </footer>
  );
}
