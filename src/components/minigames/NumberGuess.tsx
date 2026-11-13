import { useMemo, useState } from 'react';
import Button from '../ui/Button';
import { guessReward } from '../../data/miniGames';
import { sound } from '../../utils/sound';
import type { MiniGameProps } from './types';

const MAX_TRIES = 3;

export default function NumberGuess({ playerName, onFinish }: MiniGameProps) {
  const secret = useMemo(() => 1 + Math.floor(Math.random() * 10), []);
  const [guesses, setGuesses] = useState<number[]>([]);
  const won = guesses.includes(secret);
  const over = won || guesses.length >= MAX_TRIES;
  const last = guesses[guesses.length - 1];

  const guess = (n: number) => {
    if (over || guesses.includes(n)) return;
    sound.play(n === secret ? 'coin' : 'click');
    setGuesses((g) => [...g, n]);
  };

  const prize = won ? guessReward(guesses.length) : 0;

  return (
    <div className="space-y-3 text-center">
      <p className="text-sm font-semibold">
        I&apos;m thinking of a number from 1 to 10. You have <b>{MAX_TRIES}</b> tries. 1st try: $250 · 2nd: $150 · 3rd: $75
      </p>
      <div className="mx-auto grid max-w-xs grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const used = guesses.includes(n);
          return (
            <button
              key={n}
              type="button"
              disabled={over || used}
              onClick={() => guess(n)}
              aria-label={`Guess ${n}`}
              className={`toy-btn aspect-square text-xl ${used ? (n === secret ? 'bg-candy-green text-white' : 'bg-slate-200 text-slate-400') : 'bg-white hover:bg-yellow-50'}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <p className="h-6 font-display text-lg font-bold" aria-live="polite">
        {!over && last !== undefined && (last < secret ? '⬆️ Higher!' : '⬇️ Lower!')}
        {won && `🎉 It was ${secret}! You win $${prize}!`}
        {!won && over && `😅 It was ${secret}. Better luck next time.`}
      </p>
      <p className="text-xs font-semibold text-ink/60">
        Tries left: {Math.max(0, MAX_TRIES - guesses.length)}
      </p>
      {over && (
        <Button
          variant="success"
          size="lg"
          onClick={() =>
            onFinish({
              delta: prize,
              message: won ? `${playerName} guessed ${secret} in ${guesses.length} tries and won $${prize}!` : `${playerName} failed to guess ${secret}.`,
            })
          }
        >
          Continue
        </Button>
      )}
    </div>
  );
}
