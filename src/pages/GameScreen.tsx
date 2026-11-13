import { Handshake, Home, Landmark, Music, Music2, Volume2, VolumeX, FlagOff } from 'lucide-react';
import { LENGTH_CONFIG } from '../data/gameRules';
import { useAIDriver } from '../hooks/useAIDriver';
import { useGameStore } from '../store/gameStore';
import { getActor } from '../engine/gameEngine';
import { formatMoney } from '../utils/format';
import GameBoard from '../components/board/GameBoard';
import { TokenAvatar } from '../components/board/PlayerToken';
import DiceRoller from '../components/dice/DiceRoller';
import EventModal from '../components/events/EventModal';
import MiniGameModal from '../components/minigames/MiniGameModal';
import PlayerCard from '../components/players/PlayerCard';
import AuctionModal from '../components/properties/AuctionModal';
import BuyModal from '../components/properties/BuyModal';
import DebtModal from '../components/properties/DebtModal';
import PropertyManagerModal from '../components/properties/PropertyManagerModal';
import PropertyModal from '../components/properties/PropertyModal';
import TradeOfferModal from '../components/properties/TradeOfferModal';
import TradingModal from '../components/properties/TradingModal';
import Button from '../components/ui/Button';
import FxLayer from '../components/ui/FxLayer';
import GameLog from '../components/ui/GameLog';
import GameOverModal from '../components/ui/GameOverModal';

export default function GameScreen() {
  useAIDriver();
  const game = useGameStore((s) => s.game);
  const busy = useGameStore((s) => s.busy);
  const rolling = useGameStore((s) => s.rolling);
  const settings = useGameStore((s) => s.settings);
  const selected = useGameStore((s) => s.selectedProperty);
  const act = useGameStore((s) => s.act);
  const select = useGameStore((s) => s.selectProperty);
  const setTradeOpen = useGameStore((s) => s.setTradeOpen);
  const setManagerOpen = useGameStore((s) => s.setManagerOpen);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const quit = useGameStore((s) => s.quitToMenu);

  if (!game) return null;
  const current = game.players[game.currentPlayerIndex];
  const actor = getActor(game);
  const humanTurn = !current.isAI && game.phase !== 'game-over';
  const free = !game.pending && !game.auction && !game.debt && !busy && !rolling;
  const canEnd = humanTurn && free && game.phase === 'post-roll';
  const canManage = humanTurn && !game.auction;
  const canTrade = humanTurn && free && game.phase !== 'game-over' && game.players.filter((p) => !p.bankrupt).length > 1;
  const maxRounds = LENGTH_CONFIG[game.settings.length].maxRounds;

  return (
    <div className="bg-party bg-confetti min-h-dvh pb-6">
      <FxLayer game={game} />

      {/* top bar */}
      <header className="mx-auto flex max-w-[1500px] items-center gap-2 px-3 py-2">
        <Button
          size="sm"
          variant="ghost"
          icon={<Home size={16} />}
          onClick={() => {
            if (game.phase === 'game-over' || window.confirm('Leave to the main menu? Your game is saved and you can resume it.')) quit();
          }}
        >
          Menu
        </Button>
        <div className="toy-panel flex min-w-0 flex-1 items-center justify-center gap-3 px-3 py-1 text-xs font-bold sm:text-sm">
          <span>
            Round {Math.min(game.round, maxRounds ?? game.round)}
            {maxRounds ? ` / ${maxRounds}` : ''}
          </span>
          {game.settings.freeParkingJackpot && <span title="Free Parking jackpot">🅿️ {formatMoney(game.freeParkingPot)}</span>}
          {game.rentHolidayTurns > 0 && <span className="text-emerald-700">🏖️ Rent holiday</span>}
        </div>
        <Button
          size="sm"
          variant="ghost"
          aria-label={settings.sfx ? 'Mute sound effects' : 'Unmute sound effects'}
          aria-pressed={!settings.sfx}
          onClick={() => updateSettings({ sfx: !settings.sfx })}
        >
          {settings.sfx ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label={settings.music ? 'Mute music' : 'Unmute music'}
          aria-pressed={!settings.music}
          onClick={() => updateSettings({ music: !settings.music })}
        >
          {settings.music ? <Music size={16} /> : <Music2 size={16} className="opacity-40" />}
        </Button>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-3 px-3 lg:grid-cols-[270px_minmax(0,1fr)_300px] xl:grid-cols-[290px_minmax(0,1fr)_320px]">
        {/* players */}
        <aside className="order-2 grid grid-cols-2 gap-2 lg:order-1 lg:grid-cols-1 lg:content-start" aria-label="Players">
          {game.players.map((p) => (
            <PlayerCard
              key={p.id}
              game={game}
              player={p}
              isCurrent={p.id === current.id && game.phase !== 'game-over'}
              onClick={() => p.position >= 0 && select(p.position)}
            />
          ))}
        </aside>

        {/* board */}
        <section className="order-1 min-w-0 lg:order-2">
          <div className="mx-auto w-full lg:max-w-[min(100%,calc(100dvh-110px))]">
            <GameBoard game={game} onSelectTile={select} highlight={selected ?? current.position}>
              <div className="hidden text-center sm:block">
                <h1 className="font-display text-[3.4cqw] font-bold leading-none text-candy-pink text-outline">MONOPOLY</h1>
                <h1 className="font-display text-[3.4cqw] font-bold leading-none text-candy-yellow text-outline">MAYHEM</h1>
              </div>
              <div className="flex items-center gap-2 rounded-full border-[3px] border-ink bg-white/90 py-1 pl-1 pr-3 shadow-pop">
                <TokenAvatar tokenId={current.tokenId} size={32} ring={current.color} />
                <span className="font-display text-sm font-bold sm:text-base">
                  {game.phase === 'game-over' ? 'Game over' : `${current.name}'s turn`}
                </span>
              </div>
              <DiceRoller />
              {actor && actor.id !== current.id && (
                <div className="rounded-full bg-candy-yellow px-3 py-1 text-xs font-bold">Waiting for {actor.name}…</div>
              )}
            </GameBoard>
          </div>
        </section>

        {/* actions + log */}
        <aside className="order-3 flex flex-col gap-3">
          <div className="toy-panel grid grid-cols-2 gap-2 p-3">
            <Button variant="info" size="sm" icon={<Landmark size={16} />} disabled={!canManage} onClick={() => setManagerOpen(true)}>
              Properties
            </Button>
            <Button variant="primary" size="sm" icon={<Handshake size={16} />} disabled={!canTrade} onClick={() => setTradeOpen(true)}>
              Trade
            </Button>
            <Button variant="success" size="lg" className="col-span-2" disabled={!canEnd} onClick={() => act({ type: 'END_TURN' })}>
              End turn
            </Button>
            {humanTurn && (
              <Button
                variant="danger"
                size="sm"
                className="col-span-2"
                icon={<FlagOff size={16} />}
                disabled={game.phase === 'game-over' || !!game.auction}
                onClick={() => {
                  if (window.confirm(`${current.name}, really declare bankruptcy and leave the game?`)) act({ type: 'BANKRUPT' });
                }}
              >
                Give up
              </Button>
            )}
          </div>
          <div className="toy-panel flex min-h-0 flex-1 flex-col p-2">
            <h2 className="px-1 pb-1 font-display text-sm font-bold">📜 Game log</h2>
            <GameLog log={game.log} className="h-56 lg:h-[420px]" />
          </div>
        </aside>
      </main>

      <PropertyModal game={game} />
      <PropertyManagerModal game={game} />
      <TradingModal game={game} />
      <BuyModal game={game} />
      <AuctionModal game={game} />
      <DebtModal game={game} />
      <TradeOfferModal game={game} />
      <EventModal game={game} />
      <MiniGameModal game={game} />
      <GameOverModal game={game} />
    </div>
  );
}
