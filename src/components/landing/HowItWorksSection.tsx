import { motion } from "framer-motion";
import { Edit3, QrCode, Share2 } from "lucide-react";

const steps = [
  { icon: QrCode, number: "01", title: "Create", text: "Create a QR code and choose what it should link to or represent." },
  { icon: Share2, number: "02", title: "Share", text: "Print it, display it, attach it to an item, or use it digitally." },
  { icon: Edit3, number: "03", title: "Update & Track", text: "Change destinations and monitor activity without replacing the QR code." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Simple from the first scan</p><h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-5xl">From idea to active QR in three steps.</h2></div>
        <div className="relative mt-14 grid gap-5 lg:grid-cols-3">
          <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-11 hidden h-px bg-gradient-to-r from-teal-300 via-cyan-400 to-blue-400 lg:block" />
          {steps.map((step, index) => <motion.article key={step.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} className="relative rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center sm:p-8"><div className="relative z-10 mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-cyan-200 bg-white text-primary shadow-sm"><step.icon className="h-7 w-7" /></div><p className="mt-6 text-xs font-bold tracking-[0.18em] text-cyan-700">STEP {step.number}</p><h3 className="mt-2 font-display text-2xl font-semibold text-slate-950">{step.title}</h3><p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-600">{step.text}</p></motion.article>)}
        </div>
      </div>
    </section>
  );
}
