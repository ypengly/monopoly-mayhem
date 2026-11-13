import { motion } from 'framer-motion';

const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/** Transform that places each numbered face on the cube. */
const FACE: Record<number, string> = {
  1: 'rotateY(0deg)',
  6: 'rotateY(180deg)',
  2: 'rotateY(90deg)',
  5: 'rotateY(-90deg)',
  3: 'rotateX(90deg)',
  4: 'rotateX(-90deg)',
};

/** Cube rotation that brings face N to the front. */
const SHOW: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: -180 },
  2: { x: 0, y: -90 },
  5: { x: 0, y: 90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
};

interface Props {
  value: number | null;
  rolling: boolean;
  size?: number;
  /** Used to make the two dice tumble differently. */
  seed?: number;
}

export default function Dice({ value, rolling, size = 72, seed = 0 }: Props) {
  const shown = value ?? 1;
  const target = SHOW[shown];
  const half = size / 2;

  return (
    <div className="dice-scene" style={{ width: size, height: size }} role="img" aria-label={rolling ? 'Rolling die' : `Die showing ${shown}`}>
      <motion.div
        className="dice-cube h-full w-full"
        animate={
          rolling
            ? {
                rotateX: [0, 360 + seed * 90, 720],
                rotateY: [0, 540, 720 + seed * 180],
                rotateZ: [0, 90, 0],
                y: [0, -26, 0, -14, 0],
                transition: { duration: 0.7 + seed * 0.12, repeat: Infinity, ease: 'linear' },
              }
            : {
                rotateX: target.x + 720,
                rotateY: target.y + 720,
                rotateZ: 0,
                y: 0,
                transition: { type: 'spring', stiffness: 90, damping: 11 },
              }
        }
      >
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="dice-face" style={{ transform: `${FACE[n]} translateZ(${half}px)` }}>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className={PIPS[n].includes(i) ? 'pip' : ''} />
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
