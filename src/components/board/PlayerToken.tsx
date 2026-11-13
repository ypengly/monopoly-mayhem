import { useEffect, useRef } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import type { LastMove, Player, TokenId } from '../../types';
import { TOKENS } from '../../data/tokens';
import { tileCenter } from '../../data/boardSpaces';

/** The glossy, 3D-inspired character badge used everywhere in the UI. */
export function TokenAvatar({
  tokenId,
  size = 44,
  ring,
  dim,
  className = '',
}: {
  tokenId: TokenId;
  size?: number;
  ring?: string;
  dim?: boolean;
  className?: string;
}) {
  const t = TOKENS[tokenId];
  return (
    <span
      aria-label={t.name}
      className={`relative inline-grid shrink-0 place-items-center rounded-full ${dim ? 'grayscale opacity-50' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 26%, #fff 0%, ${t.from} 28%, ${t.to} 100%)`,
        border: `${Math.max(2, size / 16)}px solid ${ring ?? '#2b1b5a'}`,
        boxShadow: `0 ${size / 10}px 0 rgba(43,27,90,0.35), inset 0 -${size / 9}px 0 rgba(0,0,0,0.12), inset 0 ${size / 14}px ${size / 8}px rgba(255,255,255,0.8)`,
      }}
    >
      <span style={{ fontSize: size * 0.58, lineHeight: 1 }} className="drop-shadow-[0_2px_1px_rgba(0,0,0,0.25)]">
        {t.emoji}
      </span>
    </span>
  );
}

const SLOTS: Array<[number, number]> = [
  [-30, -30],
  [30, -30],
  [-30, 30],
  [30, 30],
  [0, -42],
  [0, 42],
  [-44, 0],
  [44, 0],
];

interface Props {
  player: Player;
  slot: number;
  isCurrent: boolean;
  lastMove: LastMove | null;
}

/** Walks along the board, hopping from space to space. */
export default function PlayerToken({ player, slot, isCurrent, lastMove }: Props) {
  const controls = useAnimationControls();
  const prevPos = useRef(player.position);
  const prevMoveId = useRef<number | null>(lastMove?.id ?? null);
  const initial = useRef(tileCenter(player.position));

  useEffect(() => {
    const target = tileCenter(player.position);
    if (prevPos.current === player.position && (!lastMove || lastMove.id === prevMoveId.current)) {
      return; // nothing to animate (first render or unrelated state change)
    }
    const isNewMove = lastMove && lastMove.id !== prevMoveId.current && lastMove.playerId === player.id;
    if (lastMove) prevMoveId.current = lastMove.id;
    if (isNewMove && lastMove.kind === 'walk' && lastMove.path.length > 0) {
      const points = [prevPos.current, ...lastMove.path].map(tileCenter);
      controls.start({
        left: points.map((p) => `${p.x}%`),
        top: points.map((p) => `${p.y}%`),
        transition: { duration: Math.max(0.3, lastMove.path.length * 0.17), ease: 'linear' },
      });
    } else {
      controls.start({
        left: `${target.x}%`,
        top: `${target.y}%`,
        transition: { type: 'spring', stiffness: 120, damping: 16 },
      });
    }
    prevPos.current = player.position;
  }, [player.position, lastMove, player.id, controls]);

  const [ox, oy] = SLOTS[slot % SLOTS.length];
  const hopping = !!lastMove && lastMove.playerId === player.id;

  return (
    <motion.div
      animate={controls}
      className="pointer-events-none absolute z-20"
      initial={false}
      style={{
        width: '5.4%',
        aspectRatio: '1 / 1',
        translate: '-50% -50%',
        left: `${initial.current.x}%`,
        top: `${initial.current.y}%`,
      }}
    >
      {/* plain wrapper holds the per-slot offset so framer-motion's own transform can't clobber it */}
      <div className="h-full w-full" style={{ transform: `translate(${ox}%, ${oy}%)` }}>
        <motion.div
          key={hopping ? lastMove?.id : 'idle'}
          className="h-full w-full"
          initial={hopping ? { y: 0 } : false}
          animate={hopping ? { y: [0, -12, 0, -12, 0, -12, 0, -12, 0, -12, 0, -12, 0] } : { y: 0 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
        >
          <div
            className={`relative h-full w-full ${isCurrent ? 'animate-floaty' : ''}`}
            style={{ filter: player.bankrupt ? 'grayscale(1)' : undefined, opacity: player.bankrupt ? 0 : 1 }}
          >
            <TokenAvatar
              tokenId={player.tokenId}
              size={0}
              ring={player.color}
              className="!h-full !w-full [&>span]:!text-[min(2.6vw,22px)]"
            />
            {isCurrent && <span className="pulse-ring absolute inset-0 rounded-full" aria-hidden />}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
