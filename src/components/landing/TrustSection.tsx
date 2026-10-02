import { motion } from "framer-motion";
import { FileCheck2, LockKeyhole, ShieldCheck, UserRoundCheck } from "lucide-react";

const trustPoints = [
  { icon: LockKeyhole, title: "Account-based access", text: "Your QR codes and inventory workspace are available through your authenticated account." },
  { icon: UserRoundCheck, title: "Controlled editing", text: "Only authorised users can manage protected codes, destinations, and inventory records." },
  { icon: FileCheck2, title: "Auditable inventory history", text: "Inventory movements preserve actor, reason, date, location, and quantity context." },
  { icon: ShieldCheck, title: "Privacy-aware by design", text: "Public scan responses expose only the information required to open or display a QR code." },
];

export function TrustSection() {
  return (
    <section className="bg-cyan-50/55 py-20 sm:py-24">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.72fr_1.28fr] lg:items-center lg:px-10">
        <motion.div initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Trust and control</p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-5xl">Built for responsible QR management.</h2>
          <p className="mt-5 text-base leading-7 text-slate-600">IEOSUIA QR combines private management tools with carefully limited public scan experiences. It is designed with South African privacy expectations in mind without making unsupported certification claims.</p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2">
          {trustPoints.map((point, index) => <motion.article key={point.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm sm:p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-cyan-300"><point.icon className="h-5 w-5" /></span><h3 className="mt-4 font-display text-lg font-semibold text-slate-950">{point.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{point.text}</p></motion.article>)}
        </div>
      </div>
    </section>
  );
}
