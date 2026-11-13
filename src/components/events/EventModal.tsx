import type { GameState } from '../../types';
import { useGameStore } from '../../store/gameStore';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import EventCard from './EventCard';

/** Animated card reveal. The effect is applied when the card is acknowledged. */
export default function EventModal({ game }: { game: GameState }) {
  const busy = useGameStore((s) => s.busy);
  const act = useGameStore((s) => s.act);
  const pending = game.pending;
  const card = pending?.type === 'card' ? pending.card : null;
  const player = game.players[game.currentPlayerIndex];
  const open = !!card && !busy;

  return (
    <Modal open={open} persistent title={`${player.name} drew a card!`} width="max-w-sm" tone="from-candy-orange to-candy-pink">
      {card && (
        <div className="space-y-4">
          <EventCard card={card} />
          {player.isAI ? (
            <p className="text-center text-sm font-bold text-ink/60">The computer is reading…</p>
          ) : (
            <div className="flex justify-center">
              <Button size="lg" variant="primary" onClick={() => act({ type: 'RESOLVE_CARD' })}>
                {card.tone === 'bad' ? 'Oh no… OK' : 'Do it!'}
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
