import { useState } from 'react';
import Button from '../ui/Button';
import Dice from '../dice/Dice';
import { DUEL_STAKE } from '../../data/miniGames';
import { sound } from '../../utils/sound';
import type { MiniGameProps } from './types';

const d6 = () => 1 + Math.floor(Math.random() * 6);

export default function DiceDuel({ playerName, opponentName = 'Rival', onFinish }: MiniGameProps) {
  const [rolling, setRolling] = useState(false);
  const [mine, setMine] = useState<[number, number] | null>(null);
  const [theirs, setTheirs] = useState<[number, number] | null>(null);
  const [done, setDone] = useState<null | 'win' | 'lose' | 'tie'>(null);

  const fight = () => {
    sound.play('dice');
    setRolling(true);
    setDone(null);
    setTimeout(() => {
      const a: [number, number] = [d6(), d6()];
      const b: [number, number] = [d6(), d6()];
      setMine(a);
      setTheirs(b);
      setRolling(false);
      const ta = a[0] + a[1];
      const tb = b[0] + b[1];
      setDone(ta > tb ? 'win' : ta < tb ? 'lose' : 'tie');
    }, 1100);
  };

  const conclude = () => {
    if (done === 'win') onFinish({ delta: DUEL_STAKE, message: `${playerName} beat ${opponentName} in the Dice Duel and won $${DUEL_STAKE}!` });
    else if (done === 'lose') onFinish({ delta: -DUEL_STAKE, message: `${playerName} lost the Dice Duel to ${opponentName} and paid $${DUEL_STAKE}.` });
  };

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm font-semibold">
        Higher total wins <b>${DUEL_STAKE}</b> from the other player. Ties roll again!
      </p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: playerName, dice: mine },
          { name: opponentName, dice: theirs },
        ].map((side, idx) => (
          <div key={idx} className="toy-panel p-3">
            <div className="mb-2 truncate font-display font-bold">{side.name}</div>
            <div className="flex justify-center gap-2">
              <Dice value={side.dice ? side.dice[0] : null} rolling={rolling} size={52} seed={idx} />
              <Dice value={side.dice ? side.dice[1] : null} rolling={rolling} size={52} seed={idx + 1} />
            </div>
            <div className="mt-2 font-display text-xl font-bold">{side.dice && !rolling ? side.dice[0] + side.dice[1] : '–'}</div>
          </div>
        ))}
      </div>
      {done === 'tie' && <p className="font-display text-lg font-bold text-sky-600">It&apos;s a tie! Roll again.</p>}
      {done === 'win' && <p className="font-display text-xl font-bold text-emerald-600">You win! 🎉</p>}
      {done === 'lose' && <p className="font-display text-xl font-bold text-rose-600">You lose… 😬</p>}
      {done === 'win' || done === 'lose' ? (
        <Button variant="success" size="lg" onClick={conclude}>
          Collect result
        </Button>
      ) : (
        <Button variant="primary" size="lg" disabled={rolling} onClick={fight}>
          {done === 'tie' ? 'Roll again' : 'Duel!'}
        </Button>
      )}
    </div>
  );
}
