import { useEffect, useRef } from 'react';
import type { LogEntry } from '../../types';

const TONE: Record<LogEntry['tone'], string> = {
  info: 'text-ink/80',
  good: 'text-emerald-700 font-semibold',
  bad: 'text-rose-600 font-semibold',
  event: 'text-violet-700 font-bold',
};

export default function GameLog({ log, className = '' }: { log: LogEntry[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  return (
    <div
      ref={ref}
      aria-live="polite"
      className={`scroll-soft overflow-y-auto rounded-xl bg-white/70 p-2 text-[13px] leading-snug ${className}`}
    >
      {log.map((entry) => (
        <div key={entry.id} className={`border-b border-ink/10 py-1 last:border-0 ${TONE[entry.tone]}`}>
          <span className="mr-1 rounded bg-ink/10 px-1 text-[10px] font-bold text-ink/60">R{entry.round}</span>
          {entry.text}
        </div>
      ))}
    </div>
  );
}
