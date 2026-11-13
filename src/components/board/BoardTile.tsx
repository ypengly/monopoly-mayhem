import { memo } from 'react';
import type { BoardSpace, Player, PropertyState } from '../../types';
import { GROUPS } from '../../data/properties';
import { gridCell, sideOf } from '../../data/boardSpaces';
import { TOKENS } from '../../data/tokens';

interface Props {
  space: BoardSpace;
  state?: PropertyState;
  owner?: Player;
  highlight?: boolean;
  onSelect: (index: number) => void;
}

const FLEX: Record<string, string> = {
  bottom: 'flex-col',
  top: 'flex-col-reverse',
  left: 'flex-row-reverse',
  right: 'flex-row',
  corner: 'flex-col',
};

const CORNER_STYLE: Record<string, string> = {
  go: 'linear-gradient(135deg,#7bf0a6,#27c46b)',
  jail: 'linear-gradient(135deg,#ffb3b3,#ff6b6b)',
  parking: 'linear-gradient(135deg,#a8e0ff,#4aa8ff)',
  gotojail: 'linear-gradient(135deg,#ffd6a0,#ff9b3d)',
};

const SPECIAL_STYLE: Record<string, string> = {
  chance: 'linear-gradient(145deg,#ffe9a8,#ffc43d)',
  chest: 'linear-gradient(145deg,#e1d0ff,#b28cff)',
  tax: 'linear-gradient(145deg,#ffd0d0,#ff8f8f)',
  event: 'linear-gradient(145deg,#c8f5ff,#58d4ff)',
};

function Houses({ houses, vertical }: { houses: number; vertical: boolean }) {
  if (houses <= 0) return null;
  if (houses === 5) {
    return (
      <span
        className="rounded-[20%] border border-ink bg-red-500 shadow-sm"
        style={{ width: '34cqmin', height: '17cqmin' }}
        title="Hotel"
      />
    );
  }
  return (
    <span className={`flex items-center justify-center gap-[3cqmin] ${vertical ? 'flex-col' : ''}`}>
      {Array.from({ length: houses }, (_, i) => (
        <span
          key={i}
          className="border border-ink bg-emerald-400"
          style={{ width: '12cqmin', height: '12cqmin', clipPath: 'polygon(50% 0, 100% 40%, 100% 100%, 0 100%, 0 40%)' }}
        />
      ))}
    </span>
  );
}

function BoardTileBase({ space, state, owner, highlight, onSelect }: Props) {
  const { row, col } = gridCell(space.index);
  const side = sideOf(space.index);
  const isCorner = side === 'corner';
  const group = space.group ? GROUPS[space.group] : undefined;
  const ownable = space.type === 'property' || space.type === 'railroad' || space.type === 'utility';
  const vertical = side === 'left' || side === 'right';
  const mortgaged = !!state?.mortgaged;

  const background = isCorner
    ? CORNER_STYLE[space.type]
    : SPECIAL_STYLE[space.type] ?? undefined;

  return (
    <button
      type="button"
      aria-label={`${space.name}${space.price ? `, $${space.price}` : ''}${owner ? `, owned by ${owner.name}` : ''}`}
      onClick={() => onSelect(space.index)}
      className={`tile relative flex ${FLEX[side]} text-left transition-[filter] hover:brightness-105 focus-visible:z-10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-300 ${owner ? 'tile-owned-ring' : ''}`}
      style={{
        gridRow: row,
        gridColumn: col,
        background,
        containerType: 'size',
        ['--ring' as string]: owner?.color,
        outline: highlight ? '3px solid #ffd93d' : undefined,
        zIndex: highlight ? 5 : undefined,
      }}
    >
      {/* colour band */}
      {group && space.type === 'property' && (
        <div
          className="relative flex shrink-0 items-center justify-center border-ink/70"
          style={{
            background: group.color,
            [vertical ? 'width' : 'height']: '26%',
            [vertical ? (side === 'left' ? 'borderLeft' : 'borderRight') : side === 'bottom' ? 'borderBottom' : 'borderTop']:
              '1.5px solid rgba(43,27,90,.7)',
          }}
        >
          {state && <Houses houses={state.houses} vertical={vertical} />}
        </div>
      )}

      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center text-center leading-none ${isCorner ? 'p-[6cqmin]' : 'p-[4cqmin]'}`}
      >
        <span
          style={{ fontSize: isCorner ? '34cqmin' : ownable || space.type === 'tax' ? '26cqmin' : '30cqmin' }}
          aria-hidden
        >
          {space.emoji}
        </span>
        <span
          className={`mt-[2cqmin] hidden w-full font-display font-bold text-ink sm:block ${isCorner ? '' : ''}`}
          style={{ fontSize: isCorner ? '14cqmin' : '12.5cqmin', lineHeight: 1.05 }}
        >
          {space.name}
        </span>
        {space.price && (
          <span className="mt-[2cqmin] font-display font-bold text-ink/80" style={{ fontSize: '13cqmin' }}>
            ${space.price}
          </span>
        )}
        {space.type === 'tax' && (
          <span className="font-display font-bold text-rose-700" style={{ fontSize: '13cqmin' }}>
            -${space.amount}
          </span>
        )}
      </div>

      {/* owner badge */}
      {owner && (
        <span
          className="absolute grid place-items-center rounded-full border border-ink"
          style={{
            width: '24cqmin',
            height: '24cqmin',
            right: '3cqmin',
            bottom: '3cqmin',
            background: owner.color,
            fontSize: '15cqmin',
          }}
          aria-hidden
        >
          {TOKENS[owner.tokenId].emoji}
        </span>
      )}

      {mortgaged && (
        <span className="absolute inset-0 grid place-items-center bg-slate-700/60 font-display font-bold text-white" style={{ fontSize: '22cqmin' }}>
          MORTGAGED
        </span>
      )}
    </button>
  );
}

export default memo(BoardTileBase);
