import { motion } from "framer-motion";
import { InventoryTab } from "@/components/inventory/InventoryTab";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

export default function Inventory() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      {/* Main Content */}
      <main className="lg:ml-64">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6"
        >
          <InventoryTab />
        </motion.div>
      </main>
    </div>
  );
}
