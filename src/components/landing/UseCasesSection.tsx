import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, Church, GraduationCap, Package, Sparkles, Store, Ticket, Utensils } from "lucide-react";

const useCases = [
  { icon: BriefcaseBusiness, title: "Businesses", text: "Digital touchpoints for services, teams, and customers." },
  { icon: Store, title: "Retail", text: "Connect packaging and displays to current product information." },
  { icon: Package, title: "Inventory", text: "Identify assets and maintain controlled movement records." },
  { icon: Ticket, title: "Events", text: "Share schedules, locations, contact details, and event content." },
  { icon: Church, title: "Churches", text: "Make programmes, giving information, and resources easy to reach." },
  { icon: GraduationCap, title: "Schools", text: "Link learners and staff to resources, assets, and information." },
  { icon: Utensils, title: "Restaurants", text: "Publish menus, booking details, locations, and feedback links." },
  { icon: Sparkles, title: "Creators", text: "Bring audiences to profiles, portfolios, campaigns, and contact points." },
];

export function UseCasesSection() {
  return (
    <section id="solutions" className="bg-slate-50 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Made for the real world</p><h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-5xl">One platform. Many useful places.</h2><p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">Use a QR code wherever people or teams need fast access to information that may change.</p></div><Link to="/solutions" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-teal-700">Explore all solutions <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((useCase, index) => <motion.article key={useCase.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (index % 4) * 0.05 }} className="group rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-950/5 sm:p-6"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 text-teal-700"><useCase.icon className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-primary" /></div><h3 className="mt-5 font-display text-lg font-semibold text-slate-950">{useCase.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{useCase.text}</p></motion.article>)}
        </div>
      </div>
    </section>
  );
}
