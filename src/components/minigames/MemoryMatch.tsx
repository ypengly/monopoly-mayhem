import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { MEMORY_SYMBOLS, memoryReward } from '../../data/miniGames';
import { sound } from '../../utils/sound';
import type { MiniGameProps } from './types';

export default function MemoryMatch({ playerName, onFinish }: MiniGameProps) {
  const cards = useMemo(() => {
    const deck = [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS].map((symbol, id) => ({ id, symbol }));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }, []);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [lock, setLock] = useState(false);
  const done = matched.length === cards.length;

  useEffect(() => {
    if (flipped.length !== 2) return;
    setLock(true);
    const [a, b] = flipped;
    const same = cards[a].symbol === cards[b].symbol;
    const t = setTimeout(() => {
      if (same) {
        setMatched((m) => [...m, a, b]);
        sound.play('coin');
      } else {
        setMistakes((m) => m + 1);
      }
      setFlipped([]);
      setLock(false);
    }, same ? 350 : 800);
    return () => clearTimeout(t);
  }, [flipped, cards]);

  const flip = (i: number) => {
    if (lock || flipped.includes(i) || matched.includes(i) || flipped.length >= 2) return;
    sound.play('click');
    setFlipped((f) => [...f, i]);
  };

  const prize = memoryReward(mistakes);

  return (
    <div className="space-y-3 text-center">
      <p className="text-sm font-semibold">
        Find all 6 pairs. Prize starts at $200 and drops $25 per mistake. Mistakes: <b>{mistakes}</b>
      </p>
      <div className="mx-auto grid max-w-xs grid-cols-4 gap-2">
        {cards.map((c, i) => {
          const show = flipped.includes(i) || matched.includes(i);
          return (
            <button
              key={c.id}
              type="button"
              aria-label={show ? c.symbol : 'Hidden card'}
              onClick={() => flip(i)}
              className="aspect-square [perspective:600px]"
            >
              <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: show ? 180 : 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="absolute inset-0 grid place-items-center rounded-xl border-[3px] border-ink bg-gradient-to-br from-candy-purple to-candy-pink text-2xl text-white [backface-visibility:hidden]">
                  ?
                </div>
                <div
                  className={`absolute inset-0 grid place-items-center rounded-xl border-[3px] border-ink text-3xl [backface-visibility:hidden] ${matched.includes(i) ? 'bg-emerald-100' : 'bg-white'}`}
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  {c.symbol}
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>
      {done && (
        <div className="space-y-2">
          <p className="font-display text-xl font-bold text-emerald-600">
            Cleared with {mistakes} mistake{mistakes === 1 ? '' : 's'}: ${prize}!
          </p>
          <Button
            variant="success"
            size="lg"
            onClick={() => onFinish({ delta: prize, message: `${playerName} cleared Memory Match with ${mistakes} mistakes and won $${prize}.` })}
          >
            Collect ${prize}
          </Button>
        </div>
      )}
    </div>
  );
}
