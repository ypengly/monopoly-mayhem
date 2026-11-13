import type { GameState } from '../../types';
import { BOARD } from '../../data/boardSpaces';
import { useGameStore } from '../../store/gameStore';
import { liquidationValue } from '../../engine/economyManager';
import { canMortgage, canSellHouse, mortgageValue } from '../../engine/propertyManager';
import { ownedIndexes } from '../../engine/state';
import { formatMoney } from '../../utils/format';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

/** You owe more than you have: raise cash or go bankrupt. */
export default function DebtModal({ game }: { game: GameState }) {
  const act = useGameStore((s) => s.act);
  const busy = useGameStore((s) => s.busy);
  const debt = game.debt;
  const player = debt ? game.players.find((p) => p.id === debt.playerId) : undefined;
  const open = !!debt && !!player && !player.isAI && !busy;

  const owned = player ? ownedIndexes(game, player.id) : [];
  const potential = player ? liquidationValue(game, player.id) : 0;
  const canPay = !!debt && !!player && player.cash >= debt.total;

  return (
    <Modal open={open} persistent title="💸 You owe money!" width="max-w-md" tone="from-[#ff6b6b] to-candy-orange">
      {debt && player && (
        <div className="space-y-3">
          <div className="toy-card bg-rose-50 p-3 text-center">
            <div className="text-sm font-bold">{debt.reason}</div>
            <div className="font-display text-3xl font-bold text-rose-600">{formatMoney(debt.total)}</div>
            <div className="text-sm font-semibold">
              You have {formatMoney(player.cash)} · could raise up to {formatMoney(potential)}
            </div>
          </div>

          <div className="scroll-soft grid max-h-56 gap-1.5 overflow-y-auto">
            {owned.length === 0 && <p className="text-center text-sm font-semibold text-ink/60">You have nothing left to sell.</p>}
            {owned.map((i) => {
              const space = BOARD[i];
              const state = game.properties[i];
              const mortgage = canMortgage(game, player.id, i);
              const sell = canSellHouse(game, player.id, i);
              return (
                <div key={i} className="flex items-center gap-2 rounded-xl border-[3px] border-ink/20 bg-white p-1.5 text-sm font-bold">
                  <span className="min-w-0 flex-1 truncate">
                    {space.emoji} {space.name}
                    {state.houses > 0 && <span className="ml-1 text-xs">{state.houses === 5 ? '🏨' : `🏠×${state.houses}`}</span>}
                    {state.mortgaged && <span className="ml-1 text-xs text-rose-500">(mortgaged)</span>}
                  </span>
                  {state.houses > 0 ? (
                    <Button size="sm" variant="warn" disabled={!sell.ok} onClick={() => act({ type: 'SELL_HOUSE', index: i })}>
                      Sell bldg +{formatMoney(Math.floor((space.houseCost ?? 0) / 2))}
                    </Button>
                  ) : (
                    <Button size="sm" variant="info" disabled={!mortgage.ok} onClick={() => act({ type: 'MORTGAGE', index: i })}>
                      Mortgage +{formatMoney(mortgageValue(i))}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="success" size="lg" disabled={!canPay} onClick={() => act({ type: 'PAY_DEBT' })}>
              Pay {formatMoney(debt.total)}
            </Button>
            <Button
              variant="danger"
              size="lg"
              onClick={() => {
                if (window.confirm('Declare bankruptcy? You will be out of the game.')) act({ type: 'BANKRUPT' });
              }}
            >
              Bankrupt 💥
            </Button>
          </div>
          {!canPay && potential < debt.total && (
            <p className="text-center text-xs font-bold text-rose-600">You cannot raise enough. Bankruptcy is your only way out.</p>
          )}
        </div>
      )}
    </Modal>
  );
}
