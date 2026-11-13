import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children: ReactNode;
  width?: string;
  /** Hide the close button and ignore backdrop / Escape (forced decisions). */
  persistent?: boolean;
  tone?: string;
  zIndex?: number;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
  persistent,
  tone = 'from-candy-purple to-candy-pink',
  zIndex = 60,
}: Props) {
  useEffect(() => {
    if (!open || persistent || !onClose) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, persistent, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-end justify-center p-2 sm:items-center sm:p-4"
          style={{ zIndex }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // The exit animation keeps the buttons in the DOM briefly; make them inert
          // so a fast double-click cannot fire the same action twice.
          exit={{ opacity: 0, pointerEvents: 'none' }}
        >
          <div
            className="absolute inset-0 bg-[#1b0f3d]/70 backdrop-blur-[3px]"
            onClick={persistent ? undefined : onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`toy-card relative flex max-h-[94dvh] w-full ${width} flex-col overflow-hidden`}
            initial={{ scale: 0.7, y: 60, rotate: -2, opacity: 0 }}
            animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            {title !== undefined && (
              <div
                className={`flex items-center justify-between gap-3 border-b-[3px] border-ink bg-gradient-to-r ${tone} px-4 py-3 text-white`}
              >
                <h2 className="font-display text-xl font-bold drop-shadow-[0_2px_0_rgba(43,27,90,0.5)] sm:text-2xl">
                  {title}
                </h2>
                {!persistent && onClose && (
                  <button
                    aria-label="Close"
                    onClick={onClose}
                    className="grid h-9 w-9 place-items-center rounded-full border-[3px] border-ink bg-white text-ink transition hover:scale-110"
                  >
                    <X size={18} strokeWidth={3} />
                  </button>
                )}
              </div>
            )}
            <div className="scroll-soft min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
