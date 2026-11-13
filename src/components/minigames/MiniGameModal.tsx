import { useState } from 'react';
import type { GameState } from '../../types';
import { MINI_GAMES } from '../../data/miniGames';
import { useGameStore } from '../../store/gameStore';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import DiceDuel from './DiceDuel';
import LuckyWheel from './LuckyWheel';
import MemoryMatch from './MemoryMatch';
import NumberGuess from './NumberGuess';
import QuickTap from './QuickTap';

/** Mini-games are optional: players can always skip them from the intro. */
export default function MiniGameModal({ game }: { game: GameState }) {
  const busy = useGameStore((s) => s.busy);
  const pending = game.pending;
  const info = pending?.type === 'minigame' ? pending : null;
  const player = game.players[game.currentPlayerIndex];
  const open = !!info && !busy && !player.isAI;
  // Keyed on the turn so each new mini-game starts at its intro.
  return (
    <Modal open={open} persistent title={info ? `${MINI_GAMES[info.game].emoji} ${MINI_GAMES[info.game].name}` : ''} width="max-w-md" tone="from-candy-blue to-candy-green">
      {info && open && <Inner key={`${game.turnCount}-${game.counter}`} game={game} />}
    </Modal>
  );
}

function Inner({ game }: { game: GameState }) {
  const act = useGameStore((s) => s.act);
  const [started, setStarted] = useState(false);
  const pending = game.pending;
  if (pending?.type !== 'minigame') return null;
  const player = game.players[game.currentPlayerIndex];
  const opponent = pending.opponentId ? game.players.find((p) => p.id === pending.opponentId) : undefined;
  const meta = MINI_GAMES[pending.game];

  if (!started) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-6xl">{meta.emoji}</div>
        <p className="font-semibold">{meta.blurb}</p>
        <p className="text-xs font-bold text-ink/50">Triggered by: {pending.reason}</p>
        {pending.game === 'diceDuel' && !opponent && <p className="text-sm font-bold text-rose-600">No opponent available!</p>}
        <div className="flex justify-center gap-3">
          <Button variant="success" size="lg" disabled={pending.game === 'diceDuel' && !opponent} onClick={() => setStarted(true)}>
            Play!
          </Button>
          <Button variant="ghost" size="lg" onClick={() => act({ type: 'SKIP_MINIGAME' })}>
            Skip
          </Button>
        </div>
      </div>
    );
  }

  const finish = (o: { delta: number; message: string; jailCard?: boolean }) =>
    act({ type: 'MINIGAME_RESULT', delta: o.delta, message: o.message, jailCard: o.jailCard });
  const props = { playerName: player.name, opponentName: opponent?.name, onFinish: finish };

  switch (pending.game) {
    case 'diceDuel':
      return <DiceDuel {...props} />;
    case 'quickTap':
      return <QuickTap {...props} />;
    case 'luckyWheel':
      return <LuckyWheel {...props} />;
    case 'memoryMatch':
      return <MemoryMatch {...props} />;
    case 'numberGuess':
      return <NumberGuess {...props} />;
  }
}
