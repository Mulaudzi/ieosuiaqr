import { Link, Navigate, useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { getPublicPage } from "@/seo/publicPages";

export default function PublicSeoPage() {
  const { pathname } = useLocation();
  const page = getPublicPage(pathname);
  if (!page) return <Navigate to="/" replace />;
  return <div className="min-h-screen bg-white"><Header /><main>
    <section className="border-b border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 pb-16 pt-28 sm:pb-20 sm:pt-32"><div className="mx-auto w-full max-w-5xl px-5 sm:px-8"><nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate-600"><ol className="flex flex-wrap items-center gap-2"><li><Link className="hover:text-primary" to="/">Home</Link></li><li aria-hidden="true">/</li><li aria-current="page">{page.heading}</li></ol></nav><p className="text-sm font-bold uppercase tracking-[.18em] text-primary">{page.eyebrow}</p><h1 className="mt-4 max-w-4xl font-display text-4xl font-bold tracking-[-.04em] text-slate-950 sm:text-6xl">{page.heading}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{page.intro}</p><Button asChild size="lg" className="mt-8"><Link to="/signup">Create a QR Code Free <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></section>
    <section aria-label={`${page.heading} details`} className="py-16 sm:py-20"><div className="mx-auto grid w-full max-w-6xl gap-5 px-5 sm:px-8 md:grid-cols-3">{page.sections.map(section => <article key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><CheckCircle2 className="h-6 w-6 text-primary" /><h2 className="mt-5 font-display text-xl font-semibold text-slate-950">{section.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{section.body}</p>{section.links && <div className="mt-5 space-y-2">{section.links.map(link => <Link key={link.href} to={link.href} className="block text-sm font-semibold text-primary hover:text-teal-700">{link.label} →</Link>)}</div>}</article>)}</div></section>
    {page.faq && <section className="bg-slate-50 py-16 sm:py-20" aria-labelledby="page-faq-heading"><div className="mx-auto w-full max-w-4xl px-5 sm:px-8"><h2 id="page-faq-heading" className="font-display text-3xl font-bold text-slate-950">Frequently asked questions</h2><div className="mt-8 space-y-4">{page.faq.map(item => <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-semibold text-slate-950">{item.question}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p></article>)}</div></div></section>}
    <section className="bg-slate-950 py-14 text-white"><div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-6 px-5 sm:px-8 md:flex-row md:items-center"><div><h2 className="font-display text-2xl font-bold">Ready to create a managed QR code?</h2><p className="mt-2 text-slate-300">Start free or review the documentation before creating your first code.</p></div><div className="flex flex-wrap gap-3"><Button asChild><Link to="/signup">Start Free</Link></Button><Button variant="outline" asChild className="border-slate-600 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/docs">Read documentation</Link></Button></div></div></section>
  </main><Footer /></div>;
}
