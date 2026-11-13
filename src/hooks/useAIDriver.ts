import { useEffect } from 'react';
import { decideAIAction } from '../engine/ai/aiController';
import { AI_DELAY, useGameStore } from '../store/gameStore';

/**
 * Lets the computer players act. Whenever the game state changes (and nothing
 * is animating), schedule the next AI action after a short human-friendly delay.
 */
export function useAIDriver(): void {
  const game = useGameStore((s) => s.game);
  const busy = useGameStore((s) => s.busy);
  const rolling = useGameStore((s) => s.rolling);
  const speed = useGameStore((s) => s.settings.aiSpeed);
  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    if (screen !== 'game' || !game || game.phase === 'game-over' || busy || rolling) return;
    const action = decideAIAction(game);
    if (!action) return;
    const store = useGameStore.getState();
    // A pending card needs to be readable before it resolves.
    const isCard = game.pending?.type === 'card';
    const delay = isCard ? Math.max(AI_DELAY[speed], 1400) : AI_DELAY[speed];
    const timer = setTimeout(() => {
      if (action.type === 'ROLL') store.roll();
      else store.act(action);
    }, delay);
    return () => clearTimeout(timer);
  }, [game, busy, rolling, speed, screen]);
}
