import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BarChart3, Link2, Package, Palette } from "lucide-react";

const features = [
  { icon: Link2, title: "Dynamic QR Codes", description: "Change a supported destination without replacing the QR already in circulation.", href: "/dynamic-qr-codes", tone: "from-teal-500/15 to-cyan-500/5 text-teal-700" },
  { icon: BarChart3, title: "Scan Analytics", description: "Review supported scan totals, unique scans, trends, devices, approximate locations and recent activity.", href: "/qr-analytics", tone: "from-blue-500/15 to-cyan-500/5 text-blue-700" },
  { icon: Package, title: "Inventory Linking", description: "Connect a QR code to an item, location, status and controlled inventory movement history.", href: "/inventory-qr-codes", tone: "from-violet-500/15 to-blue-500/5 text-violet-700" },
  { icon: Palette, title: "Brand Customisation", description: "Apply supported colours, frames, patterns and a logo, then test the finished code.", href: "/branded-qr-codes", tone: "from-amber-500/15 to-orange-500/5 text-amber-700" },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-50 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">One connected platform</p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-5xl">Everything your QR code needs, in one place.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Build the code, control what it opens, understand its activity, and connect it to the item it represents.</p>
        </motion.div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.article key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ delay: index * 0.06 }} className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_-30px_rgba(15,23,42,0.5)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_20px_50px_-28px_rgba(8,145,178,0.35)] sm:p-7">
              <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${feature.tone}`}><feature.icon className="h-6 w-6" /></div>
              <h3 className="mt-6 font-display text-xl font-semibold tracking-tight text-slate-950">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
              <Link to={feature.href} className="mt-5 inline-block text-sm font-semibold text-primary hover:text-teal-700">Explore {feature.title.toLowerCase()} →</Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
