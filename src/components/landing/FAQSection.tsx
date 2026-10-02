import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const questions = [
  ["Can I update a QR code after printing it?", "Supported dynamic QR codes let you update their destination while keeping the printed QR code in use."],
  ["What scan information can I review?", "The analytics workspace reports supported scan totals, unique scans, trends, device information, approximate locations and recent activity."],
  ["Can I connect QR codes to inventory?", "Yes. You can associate QR codes with inventory records for identification and controlled item workflows."],
  ["Which QR types can I create?", "IEOSUIA QR supports URL, text, email, phone, SMS, WhatsApp, WiFi, vCard, event, location, social and app QR workflows."],
  ["Can I customise the QR design?", "Supported design controls include colours, patterns, frames and logo placement. Always test a customised code before distributing it."],
  ["Is IEOSUIA QR available on mobile devices?", "Yes. The public site and authenticated workspace are designed for modern desktop, tablet and mobile browsers."],
];

export function FAQSection() {
  return (
    <section id="faq" className="bg-white py-20 sm:py-24 lg:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.7fr_1.3fr] lg:px-10">
        <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Questions, answered</p><h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-5xl">Know what your QR workspace can do.</h2><p className="mt-5 max-w-md text-base leading-7 text-slate-600">Clear answers about dynamic codes, scan reporting, inventory links and design controls.</p><div className="mt-7 flex flex-wrap gap-4 text-sm font-semibold"><Link to="/support" className="text-primary hover:text-teal-700">Browse all support topics →</Link><Link to="/docs" className="text-slate-700 hover:text-slate-950">Read the documentation →</Link></div></div>
        <Accordion type="single" collapsible className="rounded-[2rem] border border-slate-200 bg-slate-50 px-5 sm:px-7">
          {questions.map(([question, answer], index) => <AccordionItem key={question} value={`faq-${index}`}><AccordionTrigger className="text-left font-display text-base font-semibold text-slate-950 hover:text-primary hover:no-underline">{question}</AccordionTrigger><AccordionContent className="pr-5 text-sm leading-6 text-slate-600">{answer}</AccordionContent></AccordionItem>)}
        </Accordion>
      </div>
    </section>
  );
}
