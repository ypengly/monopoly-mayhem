import type { GameState } from '../../types';
import { BOARD } from '../../data/boardSpaces';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/format';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PropertyCard from './PropertyCard';

/** The animated purchase confirmation window. */
export default function BuyModal({ game }: { game: GameState }) {
  const busy = useGameStore((s) => s.busy);
  const act = useGameStore((s) => s.act);
  const pending = game.pending;
  const player = game.players[game.currentPlayerIndex];
  const open = pending?.type === 'buy' && !busy && !player.isAI && !game.auction;
  const index = pending?.type === 'buy' ? pending.spaceIndex : null;
  const price = index !== null ? BOARD[index].price ?? 0 : 0;
  const afford = player.cash >= price;

  return (
    <Modal open={open} persistent title={`${player.name}, buy this?`} width="max-w-sm" tone="from-candy-green to-candy-blue">
      {index !== null && (
        <div className="space-y-4">
          <PropertyCard index={index} game={game} compact />
          <div className="text-center text-sm font-bold">
            You have {formatMoney(player.cash)}
            {afford ? ` - after buying: ${formatMoney(player.cash - price)}` : ` - you need ${formatMoney(price - player.cash)} more`}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="success" size="lg" disabled={!afford} onClick={() => act({ type: 'BUY' })}>
              Buy {formatMoney(price)}
            </Button>
            <Button variant="warn" size="lg" onClick={() => act({ type: 'DECLINE_BUY' })}>
              {game.settings.auctions ? 'Auction it' : 'No thanks'}
            </Button>
          </div>
          {!afford && (
            <p className="text-center text-xs font-semibold text-ink/60">
              Tip: close this by choosing Auction, or mortgage something first from the Properties panel.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
