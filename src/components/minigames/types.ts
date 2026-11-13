import type { MiniGameOutcome } from '../../data/miniGames';

export interface MiniGameProps {
  playerName: string;
  opponentName?: string;
  onFinish: (outcome: MiniGameOutcome) => void;
}
