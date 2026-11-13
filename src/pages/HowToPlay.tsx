import { ArrowLeft } from 'lucide-react';
import { LENGTH_CONFIG, PERSONALITIES, PERSONALITY_ORDER, RULES } from '../data/gameRules';
import { MINI_GAMES } from '../data/miniGames';
import { ALL_CARDS } from '../data/eventCards';
import { useGameStore } from '../store/gameStore';
import Button from '../components/ui/Button';

export default function HowToPlay() {
  const navigate = useGameStore((s) => s.navigate);
  const section = 'toy-card p-4';
  return (
    <div className="bg-party bg-confetti min-h-dvh pb-10">
      <div className="mx-auto max-w-3xl space-y-4 px-3 pt-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('menu')}>
            Back
          </Button>
          <h1 className="font-display text-3xl font-bold text-white drop-shadow">How to play</h1>
        </div>

        <section className={section}>
          <h2 className="font-display text-xl font-bold">🎯 The goal</h2>
          <p className="mt-1 text-sm font-semibold">
            Become the richest player. Buy properties, collect rent, build houses and hotels, and bankrupt your opponents. In{' '}
            <b>Quick</b> ({LENGTH_CONFIG.quick.maxRounds} rounds) and <b>Standard</b> ({LENGTH_CONFIG.standard.maxRounds} rounds) games the player with the highest net worth (cash +
            property + buildings) wins when time runs out. In <b>Long</b> games you play until only one player is left.
          </p>
        </section>

        <section className={section}>
          <h2 className="font-display text-xl font-bold">🎲 Your turn</h2>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm font-semibold">
            <li>Roll the two dice and your character hops that many spaces.</li>
            <li>Pass Start to collect a ${RULES.salary} salary.</li>
            <li>Unowned property: buy it, or it goes to auction where everyone can bid.</li>
            <li>Owned by someone else: pay rent. Own a whole colour set and the rent doubles; add houses and hotels to make it hurt.</li>
            <li>Before ending your turn you can build, mortgage, sell or trade.</li>
            <li><b>Doubles</b> give you another roll. <b>Three doubles in a row</b> sends you to Jail!</li>
          </ol>
        </section>

        <section className={section}>
          <h2 className="font-display text-xl font-bold">🏗️ Building and money</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm font-semibold">
            <li>Own every street of a colour to build. Build evenly: a hotel is the 5th building.</li>
            <li>Mortgage a property for half its price (unmortgage costs +10%). Mortgaged properties collect no rent.</li>
            <li>Taxes and fines go to the Free Parking jackpot, which the next player to land there wins.</li>
            <li>Can&apos;t afford a bill? Raise cash by mortgaging or selling buildings, or declare bankruptcy.</li>
          </ul>
        </section>

        <section className={section}>
          <h2 className="font-display text-xl font-bold">🚔 Jail</h2>
          <p className="mt-1 text-sm font-semibold">
            Land on Go To Jail, draw a bad card or roll three doubles. To leave: roll doubles, pay ${RULES.jailFine}, or use a Get Out of Jail Free card. After {RULES.maxJailTurns} failed rolls you pay the fine and move.
          </p>
        </section>

        <section className={section}>
          <h2 className="font-display text-xl font-bold">🌪️ Chaos & cards</h2>
          <p className="mt-1 text-sm font-semibold">
            {ALL_CARDS.length} event cards fill two decks. Chaos cards (🌀) include Pizza Party, Rich Uncle, Traffic Jam, Property Boom, Rent Holiday, Crazy Auction and many more. Treasure cards (🎁) are gentler. In Chaos Mode, a random event can also strike at the start of any turn.
          </p>
        </section>

        <section className={section}>
          <h2 className="font-display text-xl font-bold">🎮 Mini-games</h2>
          <ul className="mt-1 space-y-1 text-sm font-semibold">
            {Object.values(MINI_GAMES).map((g) => (
              <li key={g.id}>
                {g.emoji} <b>{g.name}</b>: {g.blurb}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs font-semibold text-ink/60">Land on the Mini-Game Arcade or draw a card. You can always skip.</p>
        </section>

        <section className={section}>
          <h2 className="font-display text-xl font-bold">🤖 Computer opponents</h2>
          <ul className="mt-1 space-y-1 text-sm font-semibold">
            {PERSONALITY_ORDER.map((p) => (
              <li key={p}>
                {PERSONALITIES[p].emoji} <b>{PERSONALITIES[p].name}</b>: {PERSONALITIES[p].blurb}
              </li>
            ))}
          </ul>
        </section>

        <section className={section}>
          <h2 className="font-display text-xl font-bold">🤝 Trading</h2>
          <p className="mt-1 text-sm font-semibold">
            After rolling (or before), press <b>Trade</b>. Offer cash, properties and jail cards in any mix. Computers judge whether a deal is fair; humans get a pop-up to accept or reject. Streets in a set that has buildings can&apos;t be traded.
          </p>
        </section>
      </div>
    </div>
  );
}
