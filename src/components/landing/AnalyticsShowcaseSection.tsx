import { motion } from "framer-motion";
import { BarChart3, MapPin, MonitorSmartphone, MousePointerClick, TrendingUp, Users } from "lucide-react";

const bars = [34, 48, 42, 66, 58, 82, 72, 92, 78, 104, 96, 122];

export function AnalyticsShowcaseSection() {
  return (
    <section className="bg-slate-950 py-20 text-white sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-400">Scan intelligence</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.035em] sm:text-5xl">See what happens after the scan.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Turn scan activity into a clear view of reach, engagement, devices, locations, and the codes people use most.</p>
          </motion.div>
          <p className="max-w-sm text-sm leading-6 text-slate-400">Preview data shown below is illustrative. Your dashboard reports activity from your own QR codes.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-cyan-950/30 backdrop-blur sm:p-6 lg:p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [MousePointerClick, "Total scans", "8,429", "+12.4%"],
              [Users, "Unique scans", "6,107", "+8.1%"],
              [MonitorSmartphone, "Top device", "Mobile", "72%"],
              [MapPin, "Top location", "Johannesburg", "1,846 scans"],
            ].map(([Icon, label, value, note]) => (
              <div key={label as string} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Icon className="h-4 w-4" /></span><span className="text-xs text-emerald-400">{note as string}</span></div>
                <p className="mt-5 text-sm text-slate-400">{label as string}</p><p className="mt-1 text-2xl font-bold tracking-tight">{value as string}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Scan trend</p><p className="text-xs text-slate-500">Recent activity</p></div><span className="flex items-center gap-1 text-xs text-emerald-400"><TrendingUp className="h-4 w-4" /> Growing</span></div>
              <div className="mt-8 flex h-44 items-end gap-2 sm:gap-3" aria-label="Illustrative scan trend chart">
                {bars.map((height, index) => <div key={index} className="group flex h-full flex-1 items-end"><div className="w-full rounded-t-md bg-gradient-to-t from-teal-500 to-cyan-300 opacity-75 transition-opacity group-hover:opacity-100" style={{ height: `${height / 1.3}%` }} /></div>)}
              </div>
              <div className="mt-3 flex justify-between text-[10px] uppercase tracking-wider text-slate-600"><span>Earlier</span><span>Today</span></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
              <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-cyan-300" /><p className="text-sm font-semibold">Top QR codes</p></div>
              <div className="mt-6 space-y-5">
                {[["Campaign landing page", 86, "2,914"], ["Product catalogue", 62, "1,768"], ["Event programme", 44, "1,203"]].map(([name, width, count]) => <div key={name as string}><div className="flex justify-between gap-3 text-xs"><span className="truncate text-slate-300">{name as string}</span><span className="text-slate-500">{count as string}</span></div><div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-blue-500" style={{ width: `${width}%` }} /></div></div>)}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
