import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section id="pricing" className="bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 py-12 text-white shadow-[0_30px_90px_-45px_rgba(8,145,178,0.7)] sm:px-10 sm:py-16 lg:px-16">
          <div aria-hidden="true" className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-40 left-1/4 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Get started free</p><h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.035em] sm:text-5xl">Ready to make your QR codes work harder?</h2><p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">Create, manage, and track smarter QR codes with IEOSUIA QR.</p><div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">{["No credit card", "QR analytics", "Inventory tools"].map(item => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" />{item}</span>)}</div></div>
            <Button size="xl" asChild className="min-h-13 shrink-0 bg-white px-7 text-slate-950 shadow-xl hover:bg-cyan-50"><Link to="/signup">Create Your First QR Code <ArrowRight className="ml-2 h-5 w-5" /></Link></Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
