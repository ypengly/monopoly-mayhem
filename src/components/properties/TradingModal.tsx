import { useMemo, useState } from 'react';
import { ArrowLeftRight, Send } from 'lucide-react';
import type { GameState, Player, Trade, TradeSide } from '../../types';
import { BOARD } from '../../data/boardSpaces';
import { GROUPS } from '../../data/properties';
import { useGameStore } from '../../store/gameStore';
import { fairnessRatio } from '../../engine/ai/aiStrategies';
import { groupHasBuildings } from '../../engine/propertyManager';
import { describeSide, validateTrade } from '../../engine/tradeManager';
import { ownedIndexes } from '../../engine/state';
import { formatMoney } from '../../utils/format';
import { TokenAvatar } from '../board/PlayerToken';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const EMPTY: TradeSide = { cash: 0, properties: [], jailCards: 0 };

export default function TradingModal({ game }: { game: GameState }) {
  const open = useGameStore((s) => s.tradeOpen);
  const setOpen = useGameStore((s) => s.setTradeOpen);
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="🤝 Make a deal" width="max-w-3xl" tone="from-candy-blue to-candy-purple">
      {open && <TradeForm game={game} onDone={() => setOpen(false)} />}
    </Modal>
  );
}

function TradeForm({ game, onDone }: { game: GameState; onDone: () => void }) {
  const act = useGameStore((s) => s.act);
  const me = game.players[game.currentPlayerIndex];
  const partners = game.players.filter((p) => !p.bankrupt && p.id !== me.id);
  const [partnerId, setPartnerId] = useState(partners[0]?.id ?? '');
  const [offer, setOffer] = useState<TradeSide>(EMPTY);
  const [request, setRequest] = useState<TradeSide>(EMPTY);
  const [feedback, setFeedback] = useState<string | null>(null);
  const partner = partners.find((p) => p.id === partnerId);

  const trade: Trade = useMemo(
    () => ({ id: 'preview', fromId: me.id, toId: partnerId, offer, request }),
    [me.id, partnerId, offer, request],
  );
  const error = partner ? validateTrade(game, trade) : 'Pick someone to trade with.';
  const ratio = partner && !error ? fairnessRatio(game, partner, trade) : null;

  const changePartner = (id: string) => {
    setPartnerId(id);
    setRequest(EMPTY);
    setFeedback(null);
  };

  const submit = () => {
    if (!partner || error) return;
    const before = game.log.length ? game.log[game.log.length - 1].id : 0;
    const err = act({ type: 'PROPOSE_TRADE', trade: { fromId: me.id, toId: partnerId, offer, request } });
    if (err) return;
    const next = useGameStore.getState().game!;
    if (partner.isAI) {
      const last = [...next.log].reverse().find((l) => l.id > before && (l.text.includes('made a deal') || l.text.includes('turned down')));
      setFeedback(last?.text ?? 'Done.');
      if (last?.text.includes('made a deal')) setTimeout(onDone, 1200);
      else {
        setOffer(offer);
      }
    } else {
      onDone();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-sm font-bold">Trade with:</span>
        {partners.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => changePartner(p.id)}
            aria-pressed={p.id === partnerId}
            className={`flex items-center gap-1.5 rounded-full border-[3px] border-ink py-1 pl-1 pr-3 text-sm font-bold ${p.id === partnerId ? 'bg-candy-yellow' : 'bg-white hover:bg-yellow-50'}`}
          >
            <TokenAvatar tokenId={p.tokenId} size={28} ring={p.color} />
            {p.name}
          </button>
        ))}
      </div>

      {partner && (
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
          <SidePicker title={`${me.name} gives`} game={game} player={me} side={offer} onChange={setOffer} />
          <div className="hidden items-center md:flex">
            <ArrowLeftRight className="text-ink/50" />
          </div>
          <SidePicker title={`${partner.name} gives`} game={game} player={partner} side={request} onChange={setRequest} />
        </div>
      )}

      <div className="toy-card bg-yellow-50 p-3 text-sm font-semibold" aria-live="polite">
        <div>
          📤 You give: <b>{describeSide(offer)}</b>
        </div>
        <div>
          📥 You get: <b>{describeSide(request)}</b>
        </div>
        {ratio !== null && partner?.isAI && (
          <div className="mt-1 text-xs text-ink/70">
            {ratio >= 1.15 ? '😍 The computer will love this deal.' : ratio >= 0.9 ? '🙂 Looks fair - they might accept.' : ratio >= 0.6 ? '🤨 They will probably want more.' : '😬 Way too one-sided for them.'}
          </div>
        )}
        {error && offer !== EMPTY && <div className="mt-1 text-xs text-rose-600">{error}</div>}
        {feedback && <div className="mt-1 text-sm text-violet-700">{feedback}</div>}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="success" icon={<Send size={18} />} disabled={!!error} onClick={submit}>
          {partner?.isAI ? 'Propose deal' : `Send to ${partner?.name ?? '…'}`}
        </Button>
      </div>
    </div>
  );
}

function SidePicker({
  title,
  game,
  player,
  side,
  onChange,
}: {
  title: string;
  game: GameState;
  player: Player;
  side: TradeSide;
  onChange: (s: TradeSide) => void;
}) {
  const owned = ownedIndexes(game, player.id);
  const toggle = (i: number) =>
    onChange({
      ...side,
      properties: side.properties.includes(i) ? side.properties.filter((x) => x !== i) : [...side.properties, i],
    });

  return (
    <div className="toy-panel p-3" style={{ borderTopWidth: 8, borderTopColor: player.color }}>
      <h3 className="mb-2 font-display text-base font-bold">{title}</h3>
      <label className="mb-2 flex items-center gap-2 text-sm font-bold">
        💵 Cash
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={player.cash}
          step={10}
          value={side.cash || ''}
          placeholder="0"
          aria-label={`${title} cash`}
          onChange={(e) => onChange({ ...side, cash: Math.max(0, Math.min(player.cash, Math.floor(Number(e.target.value) || 0))) })}
          className="w-24 rounded-full border-[3px] border-ink px-3 py-1 text-right font-display font-semibold outline-none focus:ring-4 focus:ring-candy-yellow"
        />
        <span className="text-xs font-semibold text-ink/50">of {formatMoney(player.cash)}</span>
      </label>

      {player.jailCards > 0 && (
        <label className="mb-2 flex items-center gap-2 text-sm font-bold">
          🗝️ Jail cards
          <input
            type="number"
            min={0}
            max={player.jailCards}
            value={side.jailCards || ''}
            placeholder="0"
            aria-label={`${title} jail cards`}
            onChange={(e) => onChange({ ...side, jailCards: Math.max(0, Math.min(player.jailCards, Math.floor(Number(e.target.value) || 0))) })}
            className="w-16 rounded-full border-[3px] border-ink px-3 py-1 text-right font-display font-semibold outline-none"
          />
        </label>
      )}

      {owned.length === 0 ? (
        <p className="text-xs font-semibold text-ink/50">No properties yet.</p>
      ) : (
        <div className="scroll-soft grid max-h-52 gap-1 overflow-y-auto pr-1">
          {owned.map((i) => {
            const space = BOARD[i];
            const locked = !!space.group && groupHasBuildings(game, space.group);
            const checked = side.properties.includes(i);
            return (
              <button
                key={i}
                type="button"
                role="checkbox"
                aria-checked={checked}
                disabled={locked}
                title={locked ? 'Sell the buildings in this set first' : undefined}
                onClick={() => toggle(i)}
                className={`flex items-center gap-2 rounded-xl border-[3px] px-2 py-1 text-left text-sm font-bold transition ${checked ? 'border-ink bg-candy-yellow' : 'border-ink/25 bg-white hover:border-ink/60'} ${locked ? 'opacity-40' : ''}`}
              >
                <span className="h-4 w-4 shrink-0 rounded border-2 border-ink" style={{ background: GROUPS[space.group!].color }} />
                <span className="min-w-0 flex-1 truncate">
                  {space.emoji} {space.name}
                </span>
                <span className="text-xs text-ink/60">
                  {game.properties[i].mortgaged ? '🏦 ' : ''}
                  {formatMoney(space.price ?? 0)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
