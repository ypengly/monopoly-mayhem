import type { ReactNode } from 'react';
import type { GameState } from '../../types';
import { BOARD, GRID_TEMPLATE } from '../../data/boardSpaces';
import BoardTile from './BoardTile';
import PlayerToken from './PlayerToken';

interface Props {
  game: GameState;
  onSelectTile: (index: number) => void;
  highlight?: number | null;
  children?: ReactNode; // centre of the board
}

export default function GameBoard({ game, onSelectTile, highlight, children }: Props) {
  const current = game.players[game.currentPlayerIndex];

  // Tokens that share a tile get different slots so they never fully overlap.
  const slots: Record<string, number> = {};
  const seen: Record<number, number> = {};
  for (const p of game.players) {
    if (p.bankrupt) continue;
    seen[p.position] = (seen[p.position] ?? -1) + 1;
    slots[p.id] = seen[p.position];
  }

  return (
    <div className="board-shell mx-auto aspect-square w-full" data-testid="board">
      <div className="toy-card board-felt relative h-full w-full overflow-hidden !rounded-[2.2cqw] p-[0.6cqw]">
        <div
          className="relative grid h-full w-full overflow-hidden rounded-[1.6cqw] border-2 border-ink/70"
          style={{ gridTemplateColumns: GRID_TEMPLATE, gridTemplateRows: GRID_TEMPLATE }}
        >
          {BOARD.map((space) => {
            const state = game.properties[space.index];
            const owner = state?.ownerId ? game.players.find((p) => p.id === state.ownerId) : undefined;
            return (
              <BoardTile
                key={space.index}
                space={space}
                state={state}
                owner={owner}
                highlight={highlight === space.index}
                onSelect={onSelectTile}
              />
            );
          })}

          <div
            className="relative z-10 flex flex-col items-center justify-center gap-[1.4cqw] p-[1.2cqw]"
            style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}
          >
            {children}
          </div>

          {/* tokens live in an overlay measured against the same box as the grid */}
          <div className="pointer-events-none absolute inset-0 z-20">
            {game.players.map((p) => (
              <PlayerToken
                key={p.id}
                player={p}
                slot={slots[p.id] ?? 0}
                isCurrent={p.id === current.id && game.phase !== 'game-over'}
                lastMove={game.lastMove}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
