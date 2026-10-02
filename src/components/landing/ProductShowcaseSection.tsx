import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, Edit3, ExternalLink, MoreHorizontal, Package, QrCode, Search } from "lucide-react";

const codes = [
  { name: "Summer campaign", type: "URL", scans: "482", status: "Active" },
  { name: "Front desk WiFi", type: "WiFi", scans: "216", status: "Active" },
  { name: "Projector 04", type: "Inventory", scans: "74", status: "Assigned" },
];

export function ProductShowcaseSection() {
  return (
    <section className="overflow-hidden bg-white py-20 sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-16">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.35 }}>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Built around the work</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-5xl">Your QR workspace, clearly organised.</h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">Manage codes, update destinations, see scan activity, and connect physical items without moving between disconnected tools.</p>
            <div className="mt-8 space-y-4">
              {[
                [Edit3, "Edit destinations without reprinting"],
                [BarChart3, "Review scan performance in context"],
                [Package, "Assign codes to inventory records"],
              ].map(([Icon, label]) => (
                <div key={label as string} className="flex items-center gap-3 text-sm font-medium text-slate-700"><span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-50 text-primary"><Icon className="h-4 w-4" /></span>{label as string}</div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} className="relative">
            <div aria-hidden="true" className="absolute -inset-8 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
              <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-5 py-4">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <div className="mx-auto h-7 w-44 rounded-lg bg-slate-100" />
              </div>
              <div className="grid min-h-[29rem] md:grid-cols-[11rem_1fr]">
                <aside className="hidden border-r border-slate-200 bg-slate-950 p-4 text-slate-300 md:block" aria-hidden="true">
                  <div className="mb-8 flex items-center gap-2 text-sm font-semibold text-white"><span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-500"><QrCode className="h-4 w-4" /></span> QR Workspace</div>
                  {[[QrCode, "QR Codes"], [Package, "Inventory"], [BarChart3, "Analytics"]].map(([Icon, label], index) => <div key={label as string} className={`mb-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs ${index === 0 ? "bg-white/10 text-white" : "text-slate-400"}`}><Icon className="h-4 w-4" />{label as string}</div>)}
                </aside>
                <div className="min-w-0 p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div><p className="text-xs font-semibold text-primary">QR MANAGEMENT</p><h3 className="mt-1 font-display text-2xl font-bold text-slate-950">My QR Codes</h3><p className="text-sm text-slate-500">Manage destinations and activity.</p></div>
                    <button type="button" tabIndex={-1} className="rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white">+ Create QR</button>
                  </div>
                  <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400"><Search className="h-4 w-4" /> Search QR codes</div>
                  <div className="mt-4 space-y-3">
                    {codes.map((code, index) => (
                      <div key={code.name} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                        <div className={`grid h-11 w-11 place-items-center rounded-xl ${index === 2 ? "bg-violet-50 text-violet-600" : "bg-cyan-50 text-teal-600"}`}>{index === 2 ? <Package className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}</div>
                        <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{code.name}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>{code.type}</span><span>•</span><span>{code.scans} scans</span></div></div>
                        <div className="flex items-center gap-2"><span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 sm:flex"><CheckCircle2 className="h-3 w-3" />{code.status}</span><MoreHorizontal className="h-5 w-5 text-slate-400" /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 right-4 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:flex">
              <ExternalLink className="h-5 w-5 text-primary" /><div><p className="text-xs font-semibold text-slate-900">Destination updated</p><p className="text-[11px] text-slate-500">The printed QR remains valid</p></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
