import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export default function Toast() {
  const toast = useGameStore((s) => s.toast);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[120] flex justify-center px-3">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ y: -40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="toy-card bg-[#fff1f1] px-4 py-2 text-sm font-bold text-rose-700"
          >
            ⚠️ {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
