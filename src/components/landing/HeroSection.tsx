import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, MapPin, TrendingUp } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { getIEOSUIAQrLogoSource } from "@/components/brand/IEOSUIAQrLogoAssets";

const ieosuiaLogo = getIEOSUIAQrLogoSource("standard");

const entrance = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/70 bg-white pb-16 pt-24 sm:pb-20 sm:pt-28 lg:pb-28 lg:pt-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_75%_30%,rgba(25,190,205,0.16),transparent_36%),radial-gradient(circle_at_18%_8%,rgba(37,99,235,0.09),transparent_28%)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] opacity-[0.035]"
        style={{
          backgroundImage: "linear-gradient(#082f49 1px,transparent 1px),linear-gradient(90deg,#082f49 1px,transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to bottom,black,transparent)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.03fr_.97fr] lg:gap-16 lg:px-10">
        <motion.div initial="hidden" animate="visible" variants={entrance} transition={{ duration: 0.55 }} className="max-w-2xl text-center lg:text-left">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Dynamic QR management</p>
          <h1 className="font-display text-[2.75rem] font-bold leading-[0.98] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
            Smart QR Codes.
            <span className="mt-2 block bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Create. Update. Track.
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
            Create branded QR codes, update supported destinations, review supported scan activity, and manage what each code represents—all from one focused workspace for South African organisations.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Button variant="hero" size="xl" asChild className="min-h-12 px-7 shadow-lg shadow-teal-500/20">
              <Link to="/signup">Start Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button variant="outline" size="xl" asChild className="min-h-12 border-slate-300 bg-white/80 px-7">
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>
          <p className="mt-5 text-sm text-slate-500">Create an account through IEOSUIA Central Auth to get started.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.12 }} className="relative mx-auto w-full max-w-[34rem]">
          <div aria-hidden="true" className="absolute inset-8 rounded-full bg-gradient-to-br from-teal-300/40 to-blue-400/30 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_30px_80px_-35px_rgba(8,47,73,0.45)] backdrop-blur sm:p-7">
            <div className="flex items-start justify-between gap-5 border-b border-slate-100 pb-5">
              <div>
                <p className="font-display text-xl font-semibold text-slate-950">Your Brand QR</p>
                <p className="mt-1 text-sm text-slate-500">Dynamic • Editable • Trackable</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
            </div>

            <div className="grid items-center gap-6 py-6 sm:grid-cols-[1fr_1.05fr]">
              <div className="mx-auto rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-inner">
                <QRCodeSVG
                  value="https://qr.ieosuia.com"
                  size={210}
                  level="H"
                  className="h-auto w-full max-w-[210px]"
                  fgColor="#089f94"
                  bgColor="transparent"
                  imageSettings={{ src: ieosuiaLogo, height: 16, width: 48, excavate: true }}
                  role="img"
                  aria-label="Demonstration IEOSUIA QR code"
                />
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-950 p-4 text-white">
                  <div className="flex items-center gap-2 text-xs text-slate-400"><BarChart3 className="h-4 w-4 text-cyan-400" /> Demo analytics</div>
                  <p className="mt-3 text-3xl font-bold tracking-tight">1,284</p>
                  <p className="text-sm text-slate-400">Scans</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <p className="mt-2 text-lg font-bold text-slate-900">43</p>
                    <p className="text-[11px] text-slate-500">Locations</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <p className="mt-2 text-lg font-bold text-emerald-700">+18%</p>
                    <p className="text-[11px] text-slate-500">This week</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-cyan-50 px-4 py-3 text-sm">
              <span className="font-medium text-slate-700">Destination updated</span>
              <span className="text-slate-500">QR stays the same</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
