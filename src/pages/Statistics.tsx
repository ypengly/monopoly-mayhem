import { ArrowLeft, Trash2 } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { winPercentage } from '../utils/stats';
import { formatMoney } from '../utils/format';
import Button from '../components/ui/Button';

export default function Statistics() {
  const stats = useGameStore((s) => s.stats);
  const navigate = useGameStore((s) => s.navigate);
  const clear = useGameStore((s) => s.clearStats);

  const tiles: Array<[string, string, string]> = [
    ['🎲', 'Games played', String(stats.gamesPlayed)],
    ['🏆', 'Games won', String(stats.gamesWon)],
    ['📊', 'Winning percentage', `${winPercentage(stats)}%`],
    ['🏠', 'Properties owned (total)', String(stats.propertiesOwned)],
    ['💰', 'Total money earned', formatMoney(stats.totalMoneyEarned)],
    ['💸', 'Biggest rent payment', formatMoney(stats.biggestRent)],
    ['💎', 'Most expensive property', stats.mostExpensiveProperty ? `${stats.mostExpensiveProperty.name} (${formatMoney(stats.mostExpensiveProperty.price)})` : '—'],
  ];

  return (
    <div className="bg-party bg-confetti min-h-dvh pb-10">
      <div className="mx-auto max-w-2xl px-3 pt-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('menu')}>
            Back
          </Button>
          <h1 className="font-display text-3xl font-bold text-white drop-shadow">Statistics</h1>
        </div>
        <p className="mt-1 text-sm font-bold text-white/90">Totals for human players on this device, counted when a game finishes.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {tiles.map(([emoji, label, value]) => (
            <div key={label} className="toy-card flex items-center gap-3 p-4">
              <span className="text-4xl">{emoji}</span>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-wide text-ink/50">{label}</div>
                <div className="truncate font-display text-2xl font-bold">{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            variant="danger"
            icon={<Trash2 size={18} />}
            disabled={stats.gamesPlayed === 0}
            onClick={() => window.confirm('Reset all statistics?') && clear()}
          >
            Reset statistics
          </Button>
        </div>
      </div>
    </div>
  );
}
