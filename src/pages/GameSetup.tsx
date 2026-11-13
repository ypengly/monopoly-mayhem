import { useMemo, useState } from 'react';
import { ArrowLeft, Play, Plus } from 'lucide-react';
import type { AIPersonality, GameLength, GameMode, GameSettings, PlayerConfig } from '../types';
import { CASH_OPTIONS, LENGTH_CONFIG, MODE_CONFIG, PERSONALITY_ORDER, PLAYER_COLORS } from '../data/gameRules';
import { TOKEN_ORDER } from '../data/tokens';
import PlayerSelector, { type SlotConfig } from '../components/players/PlayerSelector';
import Button from '../components/ui/Button';
import { useGameStore } from '../store/gameStore';
import { randomSeed } from '../utils/random';
import { defaultSettings } from '../engine/gameEngine';
import { formatMoney } from '../utils/format';

function defaultSlots(mode: GameMode): SlotConfig[] {
  const cfg = MODE_CONFIG[mode];
  const make = (i: number, isAI: boolean): SlotConfig => ({
    name: isAI ? ['Pixel', 'Sparky', 'Waffles', 'Zorp', 'Bolt', 'Mochi', 'Pip'][i % 7] : `Player ${i + 1}`,
    tokenId: TOKEN_ORDER[i % TOKEN_ORDER.length],
    isAI,
    personality: PERSONALITY_ORDER[(i - 1 + PERSONALITY_ORDER.length) % PERSONALITY_ORDER.length] as AIPersonality,
  });
  if (mode === 'local') return [make(0, false), make(1, false)];
  const count = mode === 'solo' ? 3 : 2;
  const slots = Array.from({ length: Math.min(count, cfg.maxPlayers) }, (_, i) => make(i, i > 0));
  return slots;
}

export default function GameSetup() {
  const mode = useGameStore((s) => s.setupMode) as GameMode;
  const navigate = useGameStore((s) => s.navigate);
  const startGame = useGameStore((s) => s.startGame);
  const cfg = MODE_CONFIG[mode];

  const [slots, setSlots] = useState<SlotConfig[]>(() => defaultSlots(mode));
  const [length, setLength] = useState<GameLength>(cfg.defaultLength);
  const [cash, setCash] = useState(LENGTH_CONFIG[cfg.defaultLength].startingCash);
  const [chaos, setChaos] = useState(cfg.chaosEvents);
  const [miniGames, setMiniGames] = useState(cfg.miniGames);
  const [jackpot, setJackpot] = useState(true);
  const [auctions, setAuctions] = useState(true);

  const lockedAI = mode === 'solo' || mode === 'local';
  const takenTokens = useMemo(() => slots.map((s) => s.tokenId), [slots]);

  const update = (i: number, patch: Partial<SlotConfig>) => setSlots((s) => s.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const addPlayer = () =>
    setSlots((s) => {
      const free = TOKEN_ORDER.find((t) => !s.some((x) => x.tokenId === t)) ?? 'cat';
      const isAI = mode === 'local' ? false : true;
      const i = s.length;
      return [
        ...s,
        {
          name: isAI ? ['Pixel', 'Sparky', 'Waffles', 'Zorp', 'Bolt', 'Mochi', 'Pip'][i % 7] : `Player ${i + 1}`,
          tokenId: free,
          isAI,
          personality: PERSONALITY_ORDER[i % PERSONALITY_ORDER.length],
        },
      ];
    });

  const names = slots.map((s) => s.name.trim() || 'Player');
  const dupNames = new Set(names).size !== names.length;
  const humans = slots.filter((s) => !s.isAI).length;
  const problem = !cfg.available
    ? 'Online multiplayer is coming soon. Try Local Multiplayer or Solo!'
    : slots.length < cfg.minPlayers
      ? `Need at least ${cfg.minPlayers} players.`
      : humans === 0
        ? 'Add at least one human player.'
        : dupNames
          ? 'Give each player a different name.'
          : null;

  const start = () => {
    if (problem) return;
    const settings: GameSettings = defaultSettings({
      mode,
      length,
      startingCash: cash,
      chaosEvents: chaos,
      miniGames,
      freeParkingJackpot: jackpot,
      auctions,
      seed: randomSeed(),
    });
    const configs: PlayerConfig[] = slots.map((s, i) => ({
      name: names[i],
      tokenId: s.tokenId,
      isAI: s.isAI,
      personality: s.isAI ? s.personality : undefined,
    }));
    startGame(settings, configs);
  };

  return (
    <div className="bg-party bg-confetti min-h-dvh pb-10">
      <div className="mx-auto max-w-3xl px-3 pt-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('menu')}>
            Back
          </Button>
          <h1 className="font-display text-2xl font-bold text-white drop-shadow sm:text-3xl">
            {cfg.emoji} {cfg.label}
          </h1>
        </div>
        <p className="mt-1 text-sm font-bold text-white/90">{cfg.blurb}</p>

        <section className="mt-4 space-y-3" aria-label="Players">
          <h2 className="font-display text-lg font-bold text-white drop-shadow">Players ({slots.length}/{cfg.maxPlayers})</h2>
          {slots.map((slot, i) => (
            <PlayerSelector
              key={i}
              index={i}
              slot={slot}
              color={PLAYER_COLORS[i % PLAYER_COLORS.length]}
              takenTokens={takenTokens}
              canToggleAI={!lockedAI}
              canRemove={slots.length > cfg.minPlayers && !(mode === 'solo' && i === 0)}
              onChange={(p) => update(i, p)}
              onRemove={() => setSlots((s) => s.filter((_, k) => k !== i))}
            />
          ))}
          {slots.length < cfg.maxPlayers && (
            <Button variant="ghost" icon={<Plus size={18} />} onClick={addPlayer}>
              Add {mode === 'local' ? 'player' : 'computer opponent'}
            </Button>
          )}
        </section>

        <section className="toy-panel mt-5 space-y-4 p-4" aria-label="Rules">
          <div>
            <h2 className="mb-2 font-display text-lg font-bold">Game length</h2>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Game length">
              {(Object.keys(LENGTH_CONFIG) as GameLength[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={length === l}
                  onClick={() => {
                    setLength(l);
                    setCash(LENGTH_CONFIG[l].startingCash);
                  }}
                  className={`rounded-2xl border-[3px] border-ink p-2 text-left ${length === l ? 'bg-candy-yellow' : 'bg-white hover:bg-yellow-50'}`}
                >
                  <div className="font-display font-bold">{LENGTH_CONFIG[l].label}</div>
                  <div className="text-xs font-semibold text-ink/70">{LENGTH_CONFIG[l].blurb}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold">Starting cash</h2>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Starting cash">
              {CASH_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={cash === c}
                  onClick={() => setCash(c)}
                  className={`rounded-full border-[3px] border-ink px-4 py-1.5 font-display font-bold ${cash === c ? 'bg-candy-green text-white' : 'bg-white hover:bg-emerald-50'}`}
                >
                  {formatMoney(c)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle label="🌪️ Chaos events" hint="Random events can strike at the start of any turn" on={chaos} set={setChaos} />
            <Toggle label="🎮 Mini-games" hint="Optional arcade games for bonus cash" on={miniGames} set={setMiniGames} />
            <Toggle label="🅿️ Free Parking jackpot" hint="Taxes and fines go into a pot" on={jackpot} set={setJackpot} />
            <Toggle label="🔨 Auctions" hint="Declined properties are auctioned" on={auctions} set={setAuctions} />
          </div>
        </section>

        {problem && <p className="mt-3 text-center text-sm font-bold text-yellow-200" role="alert">{problem}</p>}
        <div className="mt-5 flex justify-center">
          <Button size="xl" variant="success" icon={<Play size={26} fill="currentColor" />} disabled={!!problem} onClick={start}>
            Start game!
          </Button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, hint, on, set }: { label: string; hint: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => set(!on)}
      className={`flex items-center gap-3 rounded-2xl border-[3px] border-ink p-2 text-left ${on ? 'bg-emerald-50' : 'bg-white'}`}
    >
      <span className={`relative h-7 w-12 shrink-0 rounded-full border-[3px] border-ink transition ${on ? 'bg-candy-green' : 'bg-slate-300'}`}>
        <span className={`absolute top-0 h-[22px] w-[22px] rounded-full border-2 border-ink bg-white transition-all ${on ? 'left-[20px]' : 'left-0'}`} />
      </span>
      <span>
        <span className="block font-display font-bold leading-tight">{label}</span>
        <span className="block text-xs font-semibold text-ink/60">{hint}</span>
      </span>
    </button>
  );
}
