import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Lock, Skull } from 'lucide-react';
import type { GameState, Player } from '../../types';
import { PERSONALITIES } from '../../data/gameRules';
import { BOARD } from '../../data/boardSpaces';
import { GROUPS } from '../../data/properties';
import { netWorth } from '../../engine/economyManager';
import { ownedIndexes } from '../../engine/state';
import { formatMoney } from '../../utils/format';
import { TokenAvatar } from '../board/PlayerToken';

function AnimatedMoney({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 600);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{formatMoney(display)}</>;
}

interface Props {
  game: GameState;
  player: Player;
  isCurrent: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export default function PlayerCard({ game, player, isCurrent, compact, onClick }: Props) {
  const owned = ownedIndexes(game, player.id);
  const worth = netWorth(game, player.id);
  const lastFx = [...game.fx].reverse().find((f) => f.kind === 'money' && f.playerId === player.id);
  const leader =
    !player.bankrupt &&
    game.players.filter((p) => !p.bankrupt && p.id !== player.id).every((p) => netWorth(game, p.id) < worth);

  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      aria-label={`${player.name}, ${formatMoney(player.cash)}`}
      className={`toy-panel pc-root relative w-full text-left transition ${isCurrent ? '!border-candy-pink ring-4 ring-candy-yellow' : ''} ${player.bankrupt ? 'opacity-50' : ''} ${compact ? 'p-2' : 'p-3'}`}
      style={{ borderLeftWidth: 10, borderLeftColor: player.color }}
    >
      <div className="pc-row flex items-center gap-2.5">
        <TokenAvatar tokenId={player.tokenId} size={compact ? 38 : 46} ring={player.color} dim={player.bankrupt} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-display text-base font-bold leading-tight">{player.name}</span>
            {leader && <Crown size={15} className="shrink-0 text-amber-500" aria-label="Leading" />}
            {player.inJail && <Lock size={14} className="shrink-0 text-rose-500" aria-label="In jail" />}
            {player.bankrupt && <Skull size={14} className="shrink-0" aria-label="Bankrupt" />}
          </div>
          <div className="text-[11px] font-semibold text-ink/60">
            {player.isAI && player.personality ? `${PERSONALITIES[player.personality].emoji} ${PERSONALITIES[player.personality].name}` : '🙂 Human'}
            {player.jailCards > 0 && ` · 🗝️×${player.jailCards}`}
          </div>
        </div>
        <div className="pc-money relative text-right">
          <div className="font-display text-xl font-bold leading-none text-emerald-700">
            <AnimatedMoney value={player.cash} />
          </div>
          <div className="text-[10px] font-semibold text-ink/50">worth {formatMoney(worth)}</div>
          <AnimatePresence>
            {lastFx && lastFx.kind === 'money' && (
              <motion.span
                key={lastFx.id}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -22 }}
                transition={{ duration: 1.6 }}
                className={`pointer-events-none absolute right-0 top-0 font-display text-sm font-bold ${lastFx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {lastFx.amount >= 0 ? '+' : '-'}${Math.abs(lastFx.amount)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
      {!compact && owned.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1" aria-label={`${owned.length} properties`}>
          {owned.map((i) => (
            <span
              key={i}
              title={BOARD[i].name}
              className="h-3.5 w-3.5 rounded-[4px] border-2 border-ink"
              style={{
                background: GROUPS[BOARD[i].group!].color,
                opacity: game.properties[i].mortgaged ? 0.35 : 1,
              }}
            />
          ))}
        </div>
      )}
    </motion.button>
  );
}
