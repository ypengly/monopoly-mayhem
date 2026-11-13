import type { GameState } from '../../types';
import { BOARD } from '../../data/boardSpaces';
import { useGameStore } from '../../store/gameStore';
import { describeSide } from '../../engine/tradeManager';
import { formatMoney } from '../../utils/format';
import { TokenAvatar } from '../board/PlayerToken';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

/** Shown to a human who has been offered a deal by another player. */
export default function TradeOfferModal({ game }: { game: GameState }) {
  const act = useGameStore((s) => s.act);
  const pending = game.pending;
  const trade = pending?.type === 'tradeOffer' ? pending.trade : null;
  const from = trade ? game.players.find((p) => p.id === trade.fromId) : undefined;
  const to = trade ? game.players.find((p) => p.id === trade.toId) : undefined;
  const open = !!trade && !!to && !to.isAI;

  return (
    <Modal open={open} persistent title={`📨 Deal for ${to?.name ?? ''}`} width="max-w-md" tone="from-candy-blue to-candy-purple">
      {trade && from && to && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 font-display font-bold">
            <TokenAvatar tokenId={from.tokenId} size={36} ring={from.color} /> {from.name} offers you a deal
          </div>
          <Side title="You would get" side={trade.offer} />
          <Side title="You would give" side={trade.request} />
          <p className="text-center text-xs font-semibold text-ink/60">
            ({describeSide(trade.offer)} for {describeSide(trade.request)})
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="success" size="lg" onClick={() => act({ type: 'ACCEPT_TRADE' })}>
              Accept
            </Button>
            <Button variant="danger" size="lg" onClick={() => act({ type: 'REJECT_TRADE' })}>
              Reject
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Side({ title, side }: { title: string; side: { cash: number; properties: number[]; jailCards: number } }) {
  const empty = !side.cash && !side.properties.length && !side.jailCards;
  return (
    <div className="toy-panel p-2.5">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/50">{title}</div>
      {empty ? (
        <div className="text-sm font-semibold">Nothing</div>
      ) : (
        <ul className="space-y-0.5 text-sm font-bold">
          {side.cash > 0 && <li>💵 {formatMoney(side.cash)}</li>}
          {side.properties.map((i) => (
            <li key={i}>
              {BOARD[i].emoji} {BOARD[i].name} ({formatMoney(BOARD[i].price ?? 0)})
            </li>
          ))}
          {side.jailCards > 0 && <li>🗝️ {side.jailCards} jail-free card{side.jailCards > 1 ? 's' : ''}</li>}
        </ul>
      )}
    </div>
  );
}
