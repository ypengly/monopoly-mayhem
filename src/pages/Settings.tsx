import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { sound } from '../utils/sound';
import Button from '../components/ui/Button';

export default function Settings() {
  const settings = useGameStore((s) => s.settings);
  const update = useGameStore((s) => s.updateSettings);
  const navigate = useGameStore((s) => s.navigate);

  const row = 'toy-card flex items-center justify-between gap-3 p-4';
  const pill = (on: boolean) => `rounded-full border-[3px] border-ink px-4 py-1.5 font-display font-bold ${on ? 'bg-candy-green text-white' : 'bg-white'}`;

  return (
    <div className="bg-party bg-confetti min-h-dvh pb-10">
      <div className="mx-auto max-w-xl space-y-3 px-3 pt-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('menu')}>
            Back
          </Button>
          <h1 className="font-display text-3xl font-bold text-white drop-shadow">Settings</h1>
        </div>

        <div className={row}>
          <span className="font-display text-lg font-bold">🔊 Sound effects</span>
          <button type="button" role="switch" aria-checked={settings.sfx} className={pill(settings.sfx)} onClick={() => update({ sfx: !settings.sfx })}>
            {settings.sfx ? 'On' : 'Off'}
          </button>
        </div>
        <div className={row}>
          <span className="font-display text-lg font-bold">🎵 Music</span>
          <button type="button" role="switch" aria-checked={settings.music} className={pill(settings.music)} onClick={() => update({ music: !settings.music })}>
            {settings.music ? 'On' : 'Off'}
          </button>
        </div>
        <div className={row}>
          <label htmlFor="volume" className="font-display text-lg font-bold">
            📢 Volume
          </label>
          <input
            id="volume"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            onChange={(e) => update({ volume: Number(e.target.value) })}
            onPointerUp={() => sound.play('coin')}
            className="w-40 accent-[#ff5fa2]"
          />
        </div>
        <div className={row}>
          <span className="font-display text-lg font-bold">⏩ Computer speed</span>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Computer speed">
            {(['slow', 'normal', 'fast'] as const).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={settings.aiSpeed === s} className={pill(settings.aiSpeed === s)} onClick={() => update({ aiSpeed: s })}>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className={row}>
          <span className="font-display text-lg font-bold">🐢 Reduce motion</span>
          <button type="button" role="switch" aria-checked={settings.reducedMotion} className={pill(settings.reducedMotion)} onClick={() => update({ reducedMotion: !settings.reducedMotion })}>
            {settings.reducedMotion ? 'On' : 'Off'}
          </button>
        </div>
        <p className="text-center text-xs font-bold text-white/80">Settings and your saved game live in this browser&apos;s LocalStorage.</p>
      </div>
    </div>
  );
}
