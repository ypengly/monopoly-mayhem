import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { TAP_MAX, TAP_SECONDS, TAP_VALUE } from '../../data/miniGames';
import { sound } from '../../utils/sound';
import type { MiniGameProps } from './types';

export default function QuickTap({ playerName, onFinish }: MiniGameProps) {
  const [phase, setPhase] = useState<'ready' | 'go' | 'done'>('ready');
  const [taps, setTaps] = useState(0);
  const [left, setLeft] = useState(TAP_SECONDS);
  const tapsRef = useRef(0);

  useEffect(() => {
    if (phase !== 'go') return;
    const end = performance.now() + TAP_SECONDS * 1000;
    const id = setInterval(() => {
      const remaining = Math.max(0, end - performance.now());
      setLeft(remaining / 1000);
      if (remaining <= 0) {
        clearInterval(id);
        setPhase('done');
      }
    }, 50);
    return () => clearInterval(id);
  }, [phase]);

  const tap = () => {
    if (phase === 'ready') {
      setPhase('go');
    }
    if (phase === 'ready' || phase === 'go') {
      tapsRef.current += 1;
      setTaps(tapsRef.current);
      sound.play('click');
    }
  };

  const prize = Math.min(TAP_MAX, taps * TAP_VALUE);

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm font-semibold">
        Tap as fast as you can for {TAP_SECONDS} seconds. <b>${TAP_VALUE}</b> per tap (max ${TAP_MAX}).
      </p>
      <div className="mx-auto h-4 w-full max-w-xs overflow-hidden rounded-full border-[3px] border-ink bg-white">
        <div className="h-full bg-gradient-to-r from-candy-green to-candy-yellow" style={{ width: `${(left / TAP_SECONDS) * 100}%` }} />
      </div>
      <div className="font-display text-5xl font-bold">{taps}</div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        disabled={phase === 'done'}
        onPointerDown={tap}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            tap();
          }
        }}
        aria-label="Tap!"
        className="toy-btn mx-auto grid h-36 w-36 place-items-center bg-gradient-to-b from-candy-pink to-[#e63b8a] font-display text-3xl font-bold text-white disabled:opacity-60"
      >
        {phase === 'ready' ? 'TAP!' : phase === 'go' ? '👆' : '⏱️'}
      </motion.button>
      {phase === 'done' && (
        <div className="space-y-2">
          <p className="font-display text-xl font-bold text-emerald-600">
            {taps} taps = ${prize}!
          </p>
          <Button
            variant="success"
            size="lg"
            onClick={() => onFinish({ delta: prize, message: `${playerName} tapped ${taps} times and earned $${prize}!` })}
          >
            Collect ${prize}
          </Button>
        </div>
      )}
    </div>
  );
}
