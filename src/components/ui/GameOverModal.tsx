import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GameState } from '../../types';
import { useGameStore } from '../../store/gameStore';
import { formatMoney } from '../../utils/format';
import { TokenAvatar } from '../board/PlayerToken';
import { ordinal } from '../../utils/format';
import Button from './Button';
import Confetti from './Confetti';
import Modal from './Modal';

export default function GameOverModal({ game }: { game: GameState }) {
  const navigate = useGameStore((s) => s.navigate);
  const quit = useGameStore((s) => s.quitToMenu);
  const open = game.phase === 'game-over';
  const winner = game.players.find((p) => p.id === game.winnerId);
  const humanWon = !!winner && !winner.isAI;

  useEffect(() => {
    // victory fanfare is played from the store when the win fx arrives
  }, [open]);

  return (
    <>
      {open && humanWon && <Confetti count={110} />}
      <Modal open={open} persistent title={humanWon ? '🏆 Victory!' : '🏁 Game over'} width="max-w-md" tone="from-candy-yellow to-candy-orange">
        {winner && (
          <div className="space-y-4 text-center">
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }} className="flex flex-col items-center">
              <TokenAvatar tokenId={winner.tokenId} size={96} ring={winner.color} className="animate-floaty" />
              <div className="mt-3 font-display text-3xl font-bold">{winner.name} wins!</div>
              <div className="text-sm font-semibold text-ink/70">
                {game.players.filter((p) => !p.bankrupt).length === 1 ? 'Last player standing!' : 'Richest when time ran out!'}
              </div>
            </motion.div>

            <ol className="space-y-1.5 text-left">
              {game.standings.map((s, i) => {
                const p = game.players.find((x) => x.id === s.playerId)!;
                return (
                  <li key={p.id} className="toy-panel flex items-center gap-2 px-2.5 py-1.5">
                    <span className="w-9 font-display font-bold text-ink/60">{ordinal(i + 1)}</span>
                    <TokenAvatar tokenId={p.tokenId} size={30} ring={p.color} dim={p.bankrupt} />
                    <span className="min-w-0 flex-1 truncate font-bold">{p.name}</span>
                    <span className="font-display font-bold">{s.bankrupt ? '💥 Bankrupt' : formatMoney(s.netWorth)}</span>
                  </li>
                );
              })}
            </ol>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="success" size="lg" onClick={() => navigate('setup')}>
                Play again
              </Button>
              <Button variant="ghost" size="lg" onClick={quit}>
                Main menu
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
