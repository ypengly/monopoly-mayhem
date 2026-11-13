import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GameFx, GameState } from '../../types';
import { BOARD } from '../../data/boardSpaces';
import { formatMoney } from '../../utils/format';

interface Banner {
  id: number;
  text: string;
  tone: 'good' | 'bad' | 'event';
  emoji: string;
}

function toBanner(fx: GameFx, game: GameState): Banner | null {
  const name = (id: string) => game.players.find((p) => p.id === id)?.name ?? 'Someone';
  switch (fx.kind) {
    case 'rent':
      return { id: fx.id, tone: 'bad', emoji: '💸', text: `${name(fx.payerId)} pays ${formatMoney(fx.amount)} rent to ${name(fx.ownerId)}` };
    case 'purchase':
      return { id: fx.id, tone: 'good', emoji: '🏠', text: `${name(fx.playerId)} bought ${BOARD[fx.spaceIndex].name}!` };
    case 'build':
      return { id: fx.id, tone: 'good', emoji: fx.houses === 5 ? '🏨' : '🏗️', text: fx.houses === 5 ? `Hotel on ${BOARD[fx.spaceIndex].name}!` : `House #${fx.houses} on ${BOARD[fx.spaceIndex].name}` };
    case 'jail':
      return { id: fx.id, tone: 'bad', emoji: '🚔', text: `${name(fx.playerId)} goes to Jail!` };
    case 'bankrupt':
      return { id: fx.id, tone: 'bad', emoji: '💥', text: `${name(fx.playerId)} is bankrupt!` };
    case 'trade':
      return { id: fx.id, tone: 'good', emoji: '🤝', text: 'Deal done!' };
    default:
      return null;
  }
}

/** Big, short-lived announcements: rent payments, purchases, buildings, jail… */
export default function FxLayer({ game }: { game: GameState }) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const lastSeen = useRef(game.fx.length ? game.fx[game.fx.length - 1].id : 0);

  useEffect(() => {
    const fresh = game.fx.filter((f) => f.id > lastSeen.current);
    if (!fresh.length) return;
    lastSeen.current = fresh[fresh.length - 1].id;
    const made = fresh.map((f) => toBanner(f, game)).filter((b): b is Banner => !!b);
    if (!made.length) return;
    setBanners((b) => [...b, ...made].slice(-3));
    const ids = made.map((m) => m.id);
    const t = setTimeout(() => setBanners((b) => b.filter((x) => !ids.includes(x.id))), 2600);
    return () => clearTimeout(t);
  }, [game]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-[70] flex flex-col items-center gap-2 px-3" aria-hidden>
      <AnimatePresence>
        {banners.map((b) => (
          <motion.div
            key={b.id}
            initial={{ y: -30, scale: 0.6, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            className={`toy-card flex items-center gap-2 px-4 py-2 font-display text-base font-bold sm:text-lg ${b.tone === 'bad' ? '!bg-rose-100' : b.tone === 'good' ? '!bg-emerald-100' : '!bg-violet-100'}`}
          >
            <span className="text-2xl">{b.emoji}</span>
            {b.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
