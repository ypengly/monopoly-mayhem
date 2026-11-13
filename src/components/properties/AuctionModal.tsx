import { useEffect, useState } from 'react';
import type { GameState } from '../../types';
import { RULES } from '../../data/gameRules';
import { useGameStore } from '../../store/gameStore';
import { auctionBidder, minimumBid } from '../../engine/auctionManager';
import { formatMoney } from '../../utils/format';
import { TokenAvatar } from '../board/PlayerToken';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PropertyCard from './PropertyCard';

export default function AuctionModal({ game }: { game: GameState }) {
  const auction = game.auction;
  return (
    <Modal open={!!auction} persistent title={`🔨 Auction: ${auction?.reason ?? ''}`} width="max-w-md" tone="from-candy-orange to-candy-pink">
      {auction && <AuctionBody game={game} />}
    </Modal>
  );
}

function AuctionBody({ game }: { game: GameState }) {
  const act = useGameStore((s) => s.act);
  const auction = game.auction!;
  const bidderId = auctionBidder(game);
  const bidder = game.players.find((p) => p.id === bidderId);
  const high = game.players.find((p) => p.id === auction.highBidderId);
  const min = minimumBid(game);
  const [amount, setAmount] = useState(min);
  useEffect(() => setAmount(min), [min, bidderId]);

  const human = !!bidder && !bidder.isAI;
  const maxBid = bidder?.cash ?? 0;
  const valid = human && Number.isFinite(amount) && amount >= min && amount <= maxBid;

  return (
    <div className="space-y-3">
      <PropertyCard index={auction.spaceIndex} game={game} compact />

      <div className="toy-card bg-yellow-50 p-3 text-center">
        <div className="text-xs font-bold uppercase tracking-wider text-ink/50">Highest bid</div>
        <div className="font-display text-3xl font-bold text-emerald-700">{auction.currentBid ? formatMoney(auction.currentBid) : '—'}</div>
        <div className="text-sm font-semibold">{high ? `by ${high.name}` : 'No bids yet'}</div>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {auction.bidderOrder.map((id) => {
          const p = game.players.find((x) => x.id === id)!;
          return (
            <span
              key={id}
              className={`flex items-center gap-1 rounded-full border-[3px] py-0.5 pl-0.5 pr-2 text-xs font-bold ${id === bidderId ? 'border-candy-pink bg-candy-yellow' : 'border-ink/30 bg-white'}`}
            >
              <TokenAvatar tokenId={p.tokenId} size={22} ring={p.color} />
              {p.name}
            </span>
          );
        })}
      </div>

      {bidder && human ? (
        <div className="space-y-2">
          <p className="text-center font-display font-bold">
            {bidder.name}, your bid! <span className="text-xs text-ink/60">(you have {formatMoney(bidder.cash)})</span>
          </p>
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={min}
              max={maxBid}
              step={RULES.auctionIncrement}
              value={Number.isFinite(amount) ? amount : ''}
              aria-label="Bid amount"
              onChange={(e) => setAmount(Math.floor(Number(e.target.value)))}
              className="w-28 rounded-full border-[3px] border-ink px-3 py-1.5 text-center font-display text-lg font-bold outline-none focus:ring-4 focus:ring-candy-yellow"
            />
            {[10, 50, 100].map((inc) => (
              <Button key={inc} size="sm" variant="ghost" onClick={() => setAmount(Math.min(maxBid, Math.max(min, auction.currentBid + inc)))}>
                +{inc}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="success" size="lg" disabled={!valid} onClick={() => act({ type: 'BID', playerId: bidder.id, amount })}>
              Bid {Number.isFinite(amount) ? formatMoney(amount) : ''}
            </Button>
            <Button variant="danger" size="lg" onClick={() => act({ type: 'PASS_BID', playerId: bidder.id })}>
              Pass
            </Button>
          </div>
          {amount < min && <p className="text-center text-xs font-bold text-rose-600">Minimum bid is {formatMoney(min)}.</p>}
          {amount > maxBid && <p className="text-center text-xs font-bold text-rose-600">You only have {formatMoney(maxBid)}.</p>}
        </div>
      ) : (
        <p className="text-center font-display text-lg font-bold text-ink/70">{bidder?.name ?? 'Someone'} is thinking…</p>
      )}
    </div>
  );
}
