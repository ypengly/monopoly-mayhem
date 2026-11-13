import { motion } from 'framer-motion';
import { BarChart3, BookOpen, Play, Settings as SettingsIcon } from 'lucide-react';
import { MODE_CONFIG } from '../data/gameRules';
import { TOKEN_ORDER } from '../data/tokens';
import { TokenAvatar } from '../components/board/PlayerToken';
import Button from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { hasSave } from '../utils/storage';
import type { GameMode } from '../types';

const MODE_ORDER: GameMode[] = ['quick', 'classic', 'chaos', 'solo', 'local', 'online'];
const MODE_COLORS: Record<GameMode, string> = {
  quick: 'from-[#ffe066] to-[#ffb800]',
  classic: 'from-[#6cc0ff] to-[#2f8cf0]',
  chaos: 'from-[#ff8fc7] to-[#e63b8a]',
  solo: 'from-[#4ee88f] to-[#1fbf63]',
  local: 'from-[#c3a3ff] to-[#8a5cff]',
  online: 'from-[#cfd6e4] to-[#9aa4b8]',
};

export default function MainMenu() {
  const navigate = useGameStore((s) => s.navigate);
  const resume = useGameStore((s) => s.resumeGame);
  const showToast = useGameStore((s) => s.showToast);
  const stats = useGameStore((s) => s.stats);
  const canResume = hasSave();

  const pickMode = (mode: GameMode) => {
    useGameStore.setState({ setupMode: mode });
    navigate('setup');
  };

  return (
    <div className="bg-party bg-confetti min-h-dvh overflow-x-hidden">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-10 pt-8 sm:pt-12">
        {/* floating mascots */}
        <div className="mb-2 flex flex-wrap justify-center gap-2" aria-hidden>
          {TOKEN_ORDER.map((id, i) => (
            <motion.div key={id} animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.18 }}>
              <TokenAvatar tokenId={id} size={46} />
            </motion.div>
          ))}
        </div>

        <motion.h1
          initial={{ scale: 0.6, opacity: 0, rotate: -4 }}
          animate={{ scale: 1, opacity: 1, rotate: -2 }}
          transition={{ type: 'spring', stiffness: 180, damping: 12 }}
          className="text-center font-display text-5xl font-bold leading-[0.95] text-candy-yellow text-outline sm:text-7xl"
        >
          MONOPOLY
          <br />
          <span className="text-candy-pink">MAYHEM</span>
        </motion.h1>
        <p className="mt-4 max-w-md text-center text-base font-bold text-white drop-shadow sm:text-lg">
          Buy it. Build it. Lose it to a banana peel. The silliest property trading game ever!
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button size="xl" variant="success" icon={<Play size={26} fill="currentColor" />} onClick={() => pickMode('solo')}>
            Play
          </Button>
          {canResume && (
            <Button size="lg" variant="warn" onClick={() => !resume() && showToast('No saved game found.')}>
              Continue game
            </Button>
          )}
        </div>

        <h2 className="mt-9 font-display text-xl font-bold text-white drop-shadow">Choose a game mode</h2>
        <div className="mt-3 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODE_ORDER.map((mode, i) => {
            const m = MODE_CONFIG[mode];
            return (
              <motion.button
                key={mode}
                type="button"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                whileHover={{ y: -4, rotate: i % 2 ? 1 : -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => pickMode(mode)}
                className={`toy-card relative bg-gradient-to-br ${MODE_COLORS[mode]} p-4 text-left text-white`}
                aria-label={`${m.label}${m.available ? '' : ' (coming soon)'}`}
              >
                <div className="text-4xl drop-shadow">{m.emoji}</div>
                <div className="mt-1 font-display text-xl font-bold drop-shadow-[0_2px_0_rgba(43,27,90,0.45)]">{m.label}</div>
                <p className="text-sm font-semibold leading-snug text-white/95">{m.blurb}</p>
                {!m.available && (
                  <span className="absolute right-3 top-3 rounded-full border-2 border-ink bg-white px-2 py-0.5 text-xs font-bold text-ink">Soon</span>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="ghost" icon={<BookOpen size={18} />} onClick={() => navigate('howto')}>
            How to play
          </Button>
          <Button variant="ghost" icon={<BarChart3 size={18} />} onClick={() => navigate('stats')}>
            Statistics
          </Button>
          <Button variant="ghost" icon={<SettingsIcon size={18} />} onClick={() => navigate('settings')}>
            Settings
          </Button>
        </div>
        <p className="mt-5 text-xs font-bold text-white/80">
          {stats.gamesPlayed > 0 ? `${stats.gamesWon} wins from ${stats.gamesPlayed} games` : 'Your first game awaits!'}
        </p>
      </div>
    </div>
  );
}
