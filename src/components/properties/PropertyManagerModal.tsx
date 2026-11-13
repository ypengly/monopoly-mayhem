import type { GameState } from '../../types';
import { BOARD } from '../../data/boardSpaces';
import { GROUPS } from '../../data/properties';
import { useGameStore } from '../../store/gameStore';
import { ownedIndexes } from '../../engine/state';
import { formatMoney } from '../../utils/format';
import Modal from '../ui/Modal';

/** "My properties" list; tap one to build, mortgage or sell. */
export default function PropertyManagerModal({ game }: { game: GameState }) {
  const open = useGameStore((s) => s.managerOpen);
  const setOpen = useGameStore((s) => s.setManagerOpen);
  const select = useGameStore((s) => s.selectProperty);
  const player = game.players[game.currentPlayerIndex];
  const owned = ownedIndexes(game, player.id);

  return (
    <Modal open={open} onClose={() => setOpen(false)} title={`🏘️ ${player.name}'s properties`} width="max-w-md" tone="from-candy-green to-candy-blue">
      {owned.length === 0 ? (
        <p className="py-6 text-center font-semibold text-ink/60">You do not own anything yet. Land on a space and buy it!</p>
      ) : (
        <ul className="grid gap-1.5">
          {owned.map((i) => {
            const space = BOARD[i];
            const state = game.properties[i];
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    select(i);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl border-[3px] border-ink/25 bg-white p-2 text-left text-sm font-bold transition hover:border-ink"
                >
                  <span className="h-5 w-5 shrink-0 rounded border-2 border-ink" style={{ background: GROUPS[space.group!].color }} />
                  <span className="min-w-0 flex-1 truncate">
                    {space.emoji} {space.name}
                  </span>
                  <span className="text-xs">{state.mortgaged ? '🏦 mortgaged' : state.houses === 5 ? '🏨' : state.houses > 0 ? `🏠×${state.houses}` : ''}</span>
                  <span className="text-xs text-ink/60">{formatMoney(space.price ?? 0)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
