import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { WHEEL_SEGMENTS } from '../../data/miniGames';
import { sound } from '../../utils/sound';
import type { MiniGameProps } from './types';

const SIZE = 260;
const N = WHEEL_SEGMENTS.length;
const ANGLE = 360 / N;

function polar(r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [SIZE / 2 + r * Math.cos(rad), SIZE / 2 + r * Math.sin(rad)];
}

export default function LuckyWheel({ playerName, onFinish }: MiniGameProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);

  const spin = () => {
    sound.play('whoosh');
    const winner = Math.floor(Math.random() * N);
    // Segment i is centred at i*ANGLE; rotate so it ends up under the top pointer.
    const jitter = (Math.random() - 0.5) * (ANGLE * 0.7);
    const target = 360 * 6 - winner * ANGLE + jitter;
    setSpinning(true);
    setRotation((r) => r + target - (r % 360));
    setTimeout(() => {
      setSpinning(false);
      setResult(winner);
      sound.play(WHEEL_SEGMENTS[winner].delta < 0 ? 'rent' : 'coin');
    }, 4200);
  };

  const seg = result !== null ? WHEEL_SEGMENTS[result] : null;

  return (
    <div className="space-y-3 text-center">
      <p className="text-sm font-semibold">Spin for cash prizes or a Get Out of Jail Free card. Beware the red wedge!</p>
      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE + 18 }}>
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 text-3xl drop-shadow">🔻</div>
        <motion.svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute left-0 top-[18px]"
          animate={{ rotate: rotation }}
          transition={{ duration: spinning ? 4 : 0, ease: [0.12, 0.7, 0.1, 1] }}
          aria-label="Prize wheel"
        >
          <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2} fill="#2b1b5a" />
          {WHEEL_SEGMENTS.map((s, i) => {
            const a0 = i * ANGLE - ANGLE / 2;
            const a1 = i * ANGLE + ANGLE / 2;
            const [x0, y0] = polar(SIZE / 2 - 8, a0);
            const [x1, y1] = polar(SIZE / 2 - 8, a1);
            const [tx, ty] = polar(SIZE / 2 - 48, i * ANGLE);
            return (
              <g key={i}>
                <path d={`M${SIZE / 2},${SIZE / 2} L${x0},${y0} A${SIZE / 2 - 8},${SIZE / 2 - 8} 0 0 1 ${x1},${y1} Z`} fill={s.color} stroke="#2b1b5a" strokeWidth={3} />
                <text
                  x={tx}
                  y={ty}
                  fill="#fff"
                  stroke="#2b1b5a"
                  strokeWidth={0.6}
                  fontWeight={800}
                  fontSize={s.label.length > 6 ? 9 : 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${i * ANGLE} ${tx} ${ty})`}
                  style={{ fontFamily: 'Fredoka, sans-serif' }}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={20} fill="#fff" stroke="#2b1b5a" strokeWidth={4} />
        </motion.svg>
      </div>

      {seg ? (
        <div className="space-y-2">
          <p className="font-display text-xl font-bold">
            {seg.jailCard ? '🗝️ Get Out of Jail Free!' : seg.delta > 0 ? `You won $${seg.delta}! 🎉` : seg.delta < 0 ? `Ouch, -$${-seg.delta}!` : 'Nothing this time… 🤷'}
          </p>
          <Button
            variant="success"
            size="lg"
            onClick={() => onFinish({ delta: seg.delta, jailCard: seg.jailCard, message: `${playerName} spun the Lucky Wheel: ${seg.label}.` })}
          >
            Continue
          </Button>
        </div>
      ) : (
        <Button size="lg" variant="primary" disabled={spinning} onClick={spin}>
          {spinning ? 'Spinning…' : 'SPIN!'}
        </Button>
      )}
    </div>
  );
}
