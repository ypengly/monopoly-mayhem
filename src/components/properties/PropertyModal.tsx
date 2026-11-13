import { Hammer, Landmark, Minus, Banknote, Undo2 } from 'lucide-react';
import type { GameState } from '../../types';
import { BOARD } from '../../data/boardSpaces';
import { useGameStore } from '../../store/gameStore';
import {
  canBuild,
  canMortgage,
  canSellHouse,
  mortgageValue,
  unmortgageCost,
} from '../../engine/propertyManager';
import { blocked } from '../../engine/state';
import { formatMoney } from '../../utils/format';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PropertyCard from './PropertyCard';

/** Details for any tapped board space; owners can manage their property here. */
export default function PropertyModal({ game }: { game: GameState }) {
  const index = useGameStore((s) => s.selectedProperty);
  const select = useGameStore((s) => s.selectProperty);
  const act = useGameStore((s) => s.act);

  const open = index !== null;
  const space = open ? BOARD[index] : null;
  const ownable = !!space && (space.type === 'property' || space.type === 'railroad' || space.type === 'utility');
  const current = game.players[game.currentPlayerIndex];
  const state = open ? game.properties[index] : undefined;
  const mine = ownable && state?.ownerId === current.id && !current.isAI && game.phase !== 'game-over';

  return (
    <Modal open={open} onClose={() => select(null)} title={space ? `${space.emoji} ${space.name}` : ''} width="max-w-sm">
      {space && index !== null && (
        <div className="space-y-3">
          {ownable ? (
            <PropertyCard index={index} game={game} />
          ) : (
            <SpecialInfo index={index} />
          )}
          {mine && state && <OwnerActions game={game} index={index} onAct={act} />}
          {ownable && !mine && state?.ownerId && state.ownerId !== current.id && (
            <p className="text-center text-xs font-semibold text-ink/60">Use the Trade button to make a deal for this property.</p>
          )}
        </div>
      )}
    </Modal>
  );
}

function OwnerActions({ game, index, onAct }: { game: GameState; index: number; onAct: (a: import('../../types').GameAction) => string | null }) {
  const current = game.players[game.currentPlayerIndex];
  const state = game.properties[index];
  const space = BOARD[index];
  const isStreet = space.type === 'property';
  const build = isStreet ? canBuild(game, current.id, index) : { ok: false };
  const sell = canSellHouse(game, current.id, index);
  const mortgage = canMortgage(game, current.id, index);
  const canUnmortgage = state.mortgaged && current.cash >= unmortgageCost(index);
  const lock = blocked(game);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {isStreet && (
          <Button
            variant="success"
            size="sm"
            icon={<Hammer size={16} />}
            disabled={!build.ok || lock}
            title={!build.ok ? ('reason' in build ? build.reason : undefined) : undefined}
            onClick={() => onAct({ type: 'BUILD', index })}
          >
            {state.houses === 4 ? 'Build hotel' : 'Build house'} ({formatMoney(space.houseCost ?? 0)})
          </Button>
        )}
        {isStreet && (
          <Button
            variant="warn"
            size="sm"
            icon={<Minus size={16} />}
            disabled={!sell.ok}
            onClick={() => onAct({ type: 'SELL_HOUSE', index })}
          >
            Sell building (+{formatMoney(Math.floor((space.houseCost ?? 0) / 2))})
          </Button>
        )}
        {!state.mortgaged ? (
          <Button
            variant="info"
            size="sm"
            icon={<Landmark size={16} />}
            disabled={!mortgage.ok}
            onClick={() => onAct({ type: 'MORTGAGE', index })}
          >
            Mortgage (+{formatMoney(mortgageValue(index))})
          </Button>
        ) : (
          <Button
            variant="info"
            size="sm"
            icon={<Undo2 size={16} />}
            disabled={!canUnmortgage || lock}
            onClick={() => onAct({ type: 'UNMORTGAGE', index })}
          >
            Unmortgage ({formatMoney(unmortgageCost(index))})
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          icon={<Banknote size={16} />}
          disabled={state.mortgaged || state.houses > 0}
          onClick={() => onAct({ type: 'SELL_PROPERTY', index })}
        >
          Sell to bank (+{formatMoney(Math.floor((space.price ?? 0) / 2))})
        </Button>
      </div>
      {!build.ok && isStreet && 'reason' in build && build.reason && (
        <p className="text-center text-xs font-semibold text-ink/60">Can't build: {build.reason}</p>
      )}
    </div>
  );
}

function SpecialInfo({ index }: { index: number }) {
  const space = BOARD[index];
  const TEXT: Record<string, string> = {
    go: 'Pass or land here to collect your salary every lap.',
    jail: 'Just visiting! Unless you were sent here: then roll doubles, pay $50 or use a card to leave. After 3 failed turns you pay the fine.',
    parking: 'Taxes and fines pile up in a jackpot. Land here to scoop the whole pot!',
    gotojail: 'Go directly to Jail. Do not pass Start. Do not collect salary.',
    chance: 'Draw a Chaos Card. Could be great. Could be a banana peel.',
    chest: 'Draw a Treasure card. Usually friendlier than Chaos.',
    tax: `Pay $${space.amount} to the Free Parking pot.`,
    event: 'Step into the arcade for a random mini-game with cash prizes!',
  };
  return (
    <div className="toy-card bg-white p-4 text-center">
      <div className="text-5xl">{space.emoji}</div>
      <p className="mt-2 text-sm font-semibold">{TEXT[space.type]}</p>
    </div>
  );
}
