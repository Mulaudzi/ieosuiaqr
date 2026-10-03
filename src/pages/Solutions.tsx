import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, BriefcaseBusiness, Church, GraduationCap, Hotel, Package, Store, Ticket, Utensils } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const solutions = [
  ["inventory-asset-tracking", Package, "Inventory and asset tracking", "Identify supported equipment, products and assets and maintain controlled inventory history."],
  ["retail-ecommerce", Store, "Retail", "Connect product packaging or displays to current product information and review supported scan activity."],
  ["restaurants-cafes", Utensils, "Restaurants and cafes", "Share a managed menu URL, location, booking details or feedback form."],
  ["events-entertainment", Ticket, "Events", "Share event schedules, locations, contacts and current event information."],
  ["education", GraduationCap, "Schools and education", "Connect learners, staff and visitors to resources, locations or managed equipment records."],
  ["churches-religious", Church, "Churches and community organisations", "Share programmes and resources or identify supported equipment and assets."],
  ["hospitality-tourism", Hotel, "Hospitality", "Give guests access to current information, locations, WiFi details or feedback links."],
  ["professional-services", BriefcaseBusiness, "Professional services", "Share contact details, portfolios, documents and current business information."],
] as const;

export default function Solutions() {
  return <div className="min-h-screen bg-white"><Header /><main>
    <section className="border-b border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 pb-16 pt-28 sm:pt-32"><div className="mx-auto max-w-5xl px-5 sm:px-8"><p className="text-sm font-bold uppercase tracking-[.18em] text-primary">Practical use cases</p><h1 className="mt-4 font-display text-4xl font-bold tracking-[-.04em] text-slate-950 sm:text-6xl">QR code solutions grounded in current features</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">Explore concrete ways to use supported QR creation, destination management, scan reporting and inventory linking. IEOSUIA QR does not claim industry-specific integrations unless they are actually available.</p></div></section>
    <section className="py-16 sm:py-20"><div className="mx-auto grid max-w-6xl gap-5 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">{solutions.map(([id, Icon, title, description]) => <article key={id} className="rounded-3xl border border-slate-200 p-6 shadow-sm"><Icon className="h-7 w-7 text-primary" /><h2 className="mt-5 font-display text-xl font-semibold text-slate-950">{title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p><Link to={`/solutions/${id}`} className="mt-5 inline-flex items-center text-sm font-semibold text-primary hover:text-teal-700">Explore {title.toLowerCase()} <ArrowRight className="ml-2 h-4 w-4" /></Link></article>)}</div></section>
    <section className="bg-slate-50 py-14"><div className="mx-auto flex max-w-5xl flex-col justify-between gap-6 px-5 sm:px-8 md:flex-row md:items-center"><div><h2 className="font-display text-2xl font-bold text-slate-950">Need implementation guidance?</h2><p className="mt-2 text-slate-600">Review current workflows before choosing how a QR code will be used.</p></div><Link to="/docs" className="inline-flex items-center font-semibold text-primary"><BookOpen className="mr-2 h-5 w-5" />Read the documentation</Link></div></section>
  </main><Footer /></div>;
}
