import type { GameState } from '../../types';
import { BOARD } from '../../data/boardSpaces';
import { GROUPS, RAILROAD_BASE_RENT } from '../../data/properties';
import { RULES } from '../../data/gameRules';
import { formatMoney } from '../../utils/format';
import { calculateRent } from '../../engine/propertyManager';

interface Props {
  index: number;
  game?: GameState;
  compact?: boolean;
}

/** A title-deed style card for any ownable space. */
export default function PropertyCard({ index, game, compact }: Props) {
  const space = BOARD[index];
  const group = space.group ? GROUPS[space.group] : undefined;
  const state = game?.properties[index];
  const owner = state?.ownerId ? game?.players.find((p) => p.id === state.ownerId) : undefined;
  const currentRent = game && state?.ownerId ? calculateRent(game, index, 7) : null;

  return (
    <div className="overflow-hidden rounded-2xl border-[3px] border-ink bg-white text-center shadow-[0_5px_0_rgba(43,27,90,0.3)]">
      <div
        className="border-b-[3px] border-ink px-3 py-2"
        style={{ background: group?.color ?? '#ddd', color: group?.textOnColor ?? '#222' }}
      >
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-90">
          {space.type === 'property' ? 'Title Deed' : space.type === 'railroad' ? 'Transit Line' : 'Utility'}
        </div>
        <div className="font-display text-xl font-bold leading-tight">
          {space.emoji} {space.name}
        </div>
      </div>

      <div className={`space-y-1 px-3 py-2 text-sm ${compact ? 'text-xs' : ''}`}>
        {space.type === 'property' && space.rent && (
          <>
            <Row label="Rent" value={formatMoney(space.rent[0])} bold />
            <Row label="Full set (no houses)" value={formatMoney(space.rent[0] * 2)} />
            {[1, 2, 3, 4].map((n) => (
              <Row key={n} label={`With ${n} house${n > 1 ? 's' : ''}`} value={formatMoney(space.rent![n])} />
            ))}
            <Row label="With HOTEL" value={formatMoney(space.rent[5])} bold />
            <hr className="my-1 border-ink/20" />
            <Row label="House / hotel cost" value={formatMoney(space.houseCost ?? 0)} />
          </>
        )}
        {space.type === 'railroad' && (
          <>
            {[1, 2, 3, 4].map((n) => (
              <Row key={n} label={`${n} line${n > 1 ? 's' : ''} owned`} value={formatMoney(RAILROAD_BASE_RENT * 2 ** (n - 1))} />
            ))}
          </>
        )}
        {space.type === 'utility' && (
          <>
            <Row label="One utility" value="4× dice roll" />
            <Row label="Both utilities" value="10× dice roll" />
          </>
        )}
        <hr className="my-1 border-ink/20" />
        <Row label="Price" value={formatMoney(space.price ?? 0)} bold />
        <Row label="Mortgage value" value={formatMoney(Math.floor((space.price ?? 0) * RULES.mortgageRate))} />
      </div>

      {game && (
        <div className="border-t-[3px] border-ink bg-ink/5 px-3 py-2 text-sm font-semibold">
          {owner ? (
            <>
              Owned by{' '}
              <span className="rounded-full px-2 py-0.5 text-white" style={{ background: owner.color }}>
                {owner.name}
              </span>
              {state && state.houses > 0 && <span className="ml-2">{state.houses === 5 ? '🏨 Hotel' : `🏠×${state.houses}`}</span>}
              {state?.mortgaged && <span className="ml-2 text-rose-600">(mortgaged)</span>}
              {currentRent !== null && currentRent > 0 && !state?.mortgaged && space.type !== 'utility' && (
                <div className="text-xs text-ink/60">Rent right now: {formatMoney(currentRent)}</div>
              )}
              {state && state.rentBoost > 1 && <div className="text-xs text-emerald-700">📈 Boosted ×{state.rentBoost.toFixed(2)}</div>}
            </>
          ) : (
            <span className="text-emerald-700">Available to buy!</span>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? 'font-bold' : 'text-ink/80'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
