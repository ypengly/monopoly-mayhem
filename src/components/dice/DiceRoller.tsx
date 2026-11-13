import { motion } from 'framer-motion';
import { Dices } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { getActor } from '../../engine/gameEngine';
import Button from '../ui/Button';
import Dice from './Dice';

/** Dice, the roll button and the big "what happened" total. */
export default function DiceRoller() {
  const game = useGameStore((s) => s.game)!;
  const rolling = useGameStore((s) => s.rolling);
  const busy = useGameStore((s) => s.busy);
  const roll = useGameStore((s) => s.roll);
  const act = useGameStore((s) => s.act);

  const current = game.players[game.currentPlayerIndex];
  const actor = getActor(game);
  const humanTurn = !current.isAI && actor?.id === current.id;
  const canRoll = humanTurn && game.phase === 'pre-roll' && !rolling && !busy && !game.pending && !game.auction && !game.debt;
  const dice = game.dice;
  const total = dice ? dice[0] + dice[1] : null;
  const doubles = !!dice && dice[0] === dice[1];

  const jailActions = current.inJail && canRoll;

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-3 sm:gap-5">
        <Dice value={dice ? dice[0] : null} rolling={rolling} size={64} seed={0} />
        <Dice value={dice ? dice[1] : null} rolling={rolling} size={64} seed={1} />
      </div>

      <div className="h-8 text-center">
        {rolling ? (
          <span className="font-display text-xl font-bold text-ink/70">Rolling…</span>
        ) : total !== null && game.rolledThisTurn ? (
          <motion.div
            key={`${dice?.join('-')}-${game.turnCount}-${game.log.length}`}
            initial={{ scale: 0.3, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            className="font-display text-2xl font-bold text-ink"
          >
            {total}
            {doubles && <span className="ml-2 rounded-full bg-candy-yellow px-2 py-0.5 text-sm text-ink">DOUBLES!</span>}
          </motion.div>
        ) : (
          <span className="font-display text-lg font-semibold text-ink/60">
            {current.isAI ? `${current.name} is thinking…` : 'Your move!'}
          </span>
        )}
      </div>

      <Button
        size="lg"
        variant="success"
        disabled={!canRoll}
        onClick={roll}
        icon={<Dices size={22} />}
        className={canRoll ? 'pulse-ring' : ''}
      >
        {current.inJail && game.phase === 'pre-roll' ? 'Roll for doubles' : game.lastRollDoubles || game.extraRoll ? 'Roll again' : 'Roll dice'}
      </Button>

      {jailActions && (
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="warn" onClick={() => act({ type: 'PAY_JAIL_FINE' })} disabled={current.cash < 50}>
            Pay $50 fine
          </Button>
          {current.jailCards > 0 && (
            <Button size="sm" variant="info" onClick={() => act({ type: 'USE_JAIL_CARD' })}>
              Use jail-free card
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
