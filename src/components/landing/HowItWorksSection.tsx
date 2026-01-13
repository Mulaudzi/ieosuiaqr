import { motion } from "framer-motion";
import { QrCode, Tag, Scan } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: QrCode,
    title: "Create QR Code",
    description:
      "Generate a unique QR code in seconds. Choose from URL, text, contact, or any type you need.",
    color: "primary",
  },
  {
    number: "02",
    icon: Tag,
    title: "Attach to Item",
    description:
      "Link the QR code to your product, equipment, or asset. Add details like name, category, and location.",
    color: "accent",
  },
  {
    number: "03",
    icon: Scan,
    title: "Scan to Track",
    description:
      "Scan with any smartphone to view details, update status, and track movement in real-time.",
    color: "success",
  },
];

const colorClasses = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/30",
    line: "bg-primary",
  },
  accent: {
    bg: "bg-accent/10",
    text: "text-accent",
    border: "border-accent/30",
    line: "bg-accent",
  },
  success: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/30",
    line: "bg-success",
  },
};

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Three Simple Steps to{" "}
            <span className="gradient-text">Smart Tracking</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes. No special hardware required – just your smartphone and our platform.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-primary via-accent to-success opacity-30" />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => {
              const colors = colorClasses[step.color as keyof typeof colorClasses];
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="relative"
                >
                  {/* Step Card */}
                  <div className="text-center">
                    {/* Number & Icon */}
                    <div className="relative inline-flex flex-col items-center mb-6">
                      <span className={`text-sm font-bold ${colors.text} mb-2`}>
                        Step {step.number}
                      </span>
                      <div
                        className={`w-20 h-20 rounded-2xl ${colors.bg} ${colors.border} border-2 flex items-center justify-center relative z-10`}
                      >
                        <step.icon className={`w-9 h-9 ${colors.text}`} />
                      </div>
                      {/* Pulse ring */}
                      <div
                        className={`absolute top-8 w-20 h-20 rounded-2xl ${colors.bg} animate-ping opacity-20`}
                      />
                    </div>

                    {/* Content */}
                    <h3 className="font-display text-xl font-bold mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow for mobile */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden flex justify-center my-6">
                      <div className={`w-0.5 h-8 ${colors.line} opacity-30`} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Trust Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-sm text-muted-foreground">
            💡 <strong>No hardware needed</strong> – scan with any smartphone camera. Works on iOS, Android, and all modern devices.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
