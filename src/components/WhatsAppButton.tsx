import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export function WhatsAppButton() {
  return (
    <motion.a
      href="https://wa.me/27799282775?text=Hi!%20I%20need%20help%20with%20IEOSUIA%20QR."
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:bg-[#20BD5A] hover:shadow-xl lg:bottom-6 lg:right-6 lg:h-14 lg:w-14"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title="Chat on WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
      
      {/* Tooltip */}
      <span className="absolute right-16 hidden whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 lg:block">
        Call or WhatsApp us: 079 928 2775
      </span>
      
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
    </motion.a>
  );
}
