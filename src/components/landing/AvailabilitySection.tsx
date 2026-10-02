import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Package, Palette, RefreshCw, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const available = [
  { icon: RefreshCw, title: "Create and update", text: "Create supported QR types and update dynamic destinations without replacing the printed code." },
  { icon: BarChart3, title: "Track scan activity", text: "Review supported scan totals, unique scans, trends, devices, locations and recent activity." },
  { icon: Package, title: "Link inventory", text: "Associate QR codes with inventory records and controlled item workflows where supported." },
  { icon: Palette, title: "Apply your brand", text: "Customise supported colours, patterns, frames and logos while preserving scan usability." },
];

export function AvailabilitySection() {
  return (
    <section aria-labelledby="availability-heading" className="relative bg-slate-950 py-16 text-white sm:py-20">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 sm:px-8 lg:grid-cols-[1.45fr_.55fr] lg:px-10">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Available Now</p><h2 id="availability-heading" className="mt-3 font-display text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Practical QR tools, ready to use.</h2></div>
            <Link to="/docs" className="text-sm font-semibold text-cyan-300 transition hover:text-white">Explore documentation →</Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {available.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-white/10 bg-slate-900/80 p-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Icon className="h-4 w-4" /></span><h3 className="font-display font-semibold">{title}</h3></div><p className="mt-3 text-sm leading-6 text-slate-400">{text}</p></article>)}
          </div>
        </motion.div>
        <motion.aside initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }} className="flex flex-col justify-between rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 p-6 sm:p-8">
          <div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-cyan-300"><Sparkles className="h-5 w-5" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Coming Soon</p><h2 className="mt-3 font-display text-2xl font-bold">No announced additions yet.</h2><p className="mt-4 text-sm leading-6 text-slate-300">We only publish confirmed roadmap items. New capabilities will appear here after they have a defined release plan.</p></div>
          <p className="mt-8 flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="h-4 w-4 text-cyan-300" /> No speculative feature claims</p>
        </motion.aside>
      </div>
    </section>
  );
}
