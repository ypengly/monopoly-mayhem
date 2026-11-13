import { motion } from 'framer-motion';
import type { CardTone, EventCard as EventCardType } from '../../types';

const TONES: Record<CardTone, { bg: string; label: string; badge: string }> = {
  good: { bg: 'linear-gradient(160deg,#c9ffd9,#5be58f)', label: 'LUCKY!', badge: 'bg-emerald-500' },
  bad: { bg: 'linear-gradient(160deg,#ffd3d3,#ff7d7d)', label: 'OUCH!', badge: 'bg-rose-500' },
  wild: { bg: 'linear-gradient(160deg,#ead7ff,#b28cff)', label: 'WILD!', badge: 'bg-violet-500' },
  neutral: { bg: 'linear-gradient(160deg,#d6f1ff,#7fcfff)', label: 'HMMM…', badge: 'bg-sky-500' },
};

export default function EventCard({ card, flip = true }: { card: EventCardType; flip?: boolean }) {
  const tone = TONES[card.tone];
  return (
    <div style={{ perspective: 900 }}>
      <motion.div
        initial={flip ? { rotateY: 180, scale: 0.6, opacity: 0 } : false}
        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 14 }}
        className="relative mx-auto w-full max-w-xs overflow-hidden rounded-3xl border-4 border-ink p-5 text-center shadow-[0_8px_0_rgba(43,27,90,0.4)]"
        style={{ background: tone.bg, transformStyle: 'preserve-3d' }}
      >
        <span className={`absolute left-3 top-3 rounded-full border-2 border-ink px-2 py-0.5 font-display text-xs font-bold text-white ${tone.badge}`}>
          {card.deck === 'chaos' ? '🌀 CHAOS' : '🎁 TREASURE'}
        </span>
        <span className="absolute right-3 top-3 font-display text-xs font-bold text-ink/60">{tone.label}</span>
        <motion.div
          className="mt-6 text-7xl drop-shadow-[0_6px_0_rgba(43,27,90,0.25)]"
          animate={{ rotate: [-6, 6, -6], scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        >
          {card.emoji}
        </motion.div>
        <h3 className="mt-3 font-display text-2xl font-bold leading-tight">{card.title}</h3>
        <p className="mt-2 text-sm font-semibold leading-snug text-ink/80">{card.text}</p>
      </motion.div>
    </div>
  );
}
