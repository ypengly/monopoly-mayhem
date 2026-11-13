import { useMemo } from 'react';

const COLORS = ['#ff5fa2', '#ffd93d', '#3ea8ff', '#2ed573', '#a06bff', '#ff9f43'];

export default function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.6,
        duration: 2.6 + Math.random() * 2.4,
        dx: `${(Math.random() - 0.5) * 240}px`,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.6,
      })),
    [count],
  );
  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti"
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              borderRadius: p.round ? '50%' : '2px',
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--dx': p.dx,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}
