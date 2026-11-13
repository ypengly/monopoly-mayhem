# 🎲 Monopoly Mayhem

A colourful, chaotic, property-trading board game for the browser. Buy streets, build hotels, trade with cunning computer opponents, and survive banana peels, rent holidays and surprise auctions.

Everything is playable start to finish: set up a match, roll the dice, buy and trade property, get bankrupted by a Hyperloop, and crown a winner.

## Screenshots

> Add your own captures to `docs/screenshots/` and link them here.

| Main menu | In game | Mobile |
| --- | --- | --- |
| `docs/screenshots/menu.png` | `docs/screenshots/game.png` | `docs/screenshots/mobile.png` |

## Features

- **6 game modes**: Quick Match (2-4 players), Classic, Chaos, Solo vs AI, Local Multiplayer (hot-seat, up to 8) and Online Multiplayer (architecture ready, UI marked "coming soon", no fake networking).
- **40-space board** with 22 colour-coded streets, 4 transit lines, 2 utilities, taxes, Chaos and Treasure card spaces, Jail, Free Parking, Go To Jail and a Mini-Game Arcade.
- **8 glossy tokens**: Cat, Robot, Penguin, Dinosaur, Astronaut, Duck, Fox, Alien. Tokens hop space by space.
- **3D tumbling dice** with doubles, extra rolls and three-doubles-to-jail.
- **Full property economy**: buy, auction, rent (set bonus, houses, hotels, stations, utilities), mortgage, sell, build evenly, bankruptcy with creditor inheritance.
- **55 event cards** (33 Chaos + 22 Treasure) with animated reveals: Pizza Party, Rich Uncle, Bank Error, Broken Elevator, Tax Inspection, Lucky Day, Traffic Jam, Property Boom, Rent Holiday, Crazy Auction, Body Swap, Robin Hood Day and more. Chaos Mode also fires random events at the start of turns.
- **5 optional mini-games**: Dice Duel, Quick Tap, Lucky Wheel, Memory Match, Number Guess.
- **4 AI personalities**: The Investor, The Banker, The Aggressive Trader, The Lucky Gambler. They buy, bid, build, raise cash from debt, propose deals and judge trade fairness.
- **Trading UI** for cash, properties, jail cards and any mix of them, with a fairness hint against computer players and accept/reject pop-ups for humans.
- **Statistics**: games played/won, win %, properties owned, money earned, biggest rent, most expensive property.
- **Save and resume** (LocalStorage autosave after every action), plus persisted settings and stats.
- **Synthesised sound** played through Howler.js (dice, coins, purchases, rent, events, jail, win and lose jingles, looping music). No audio files to ship; mute buttons in-game and in Settings.
- Responsive layout for desktop, tablet and phone; keyboard focus styles, ARIA labels and a Reduce Motion switch.

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS 3 · Framer Motion · Zustand · Howler.js · Lucide React · Vitest. LocalStorage for persistence.

## Installation

```bash
npm install
```

Requires Node 18+.

## Development commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Run the unit test suite once |
| `npm run build` | Type check and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |

## Build

```bash
npm run build
```

The static site is written to `dist/`.

## Game rules

1. Every player starts with the chosen cash (Quick $1,000, Standard/Long $1,500 by default; configurable).
2. On your turn roll two dice and move. Passing or landing on Start pays a **$200 salary**.
3. **Unowned property**: buy it at list price, or decline and it goes to **auction** (bids in $10 steps, bidders drop out by passing).
4. **Rent**: owners collect rent. A complete colour set doubles base rent; 1-4 houses and a hotel (the 5th building) use the street's rent table. Stations charge $25/$50/$100/$200 for 1-4 owned. Utilities charge 4× (one) or 10× (both) the dice total. Mortgaged properties collect nothing.
5. **Building** needs a complete, unmortgaged colour set and must be even across the set. Buildings sell back at half price.
6. **Mortgage** for half the price; unmortgage costs +10%. You can also sell an unbuilt property to the bank for half its price.
7. **Doubles** roll again. **Three doubles in a row** goes to Jail.
8. **Jail**: roll doubles, pay $50, or use a Get Out of Jail Free card. After three failed rolls you pay the fine and move.
9. **Taxes and fines** feed the **Free Parking jackpot** (optional); landing on Free Parking collects it.
10. **Debt**: if you can't pay, raise cash by mortgaging or selling buildings, or declare **bankruptcy**. A single creditor inherits your properties; the bank takes them otherwise.
11. **Winning**:
    - **Quick**: after 15 rounds, richest wins.
    - **Standard**: after 40 rounds, richest wins.
    - **Long**: last player standing.
    - Net worth = cash + property price (half if mortgaged) + building costs. A hard 400-round cap guards against endless games.

## Architecture

The engine is pure TypeScript with no React or browser imports. All state changes go through one function:

```ts
dispatch(state: GameState, action: GameAction): { state: GameState; error: string | null }
```

It never mutates the input, rejects illegal actions with a message, uses a seeded PRNG stored in the state (so games are reproducible), and the whole state is JSON-serialisable. That makes saving trivial and makes online play a matter of running `dispatch` on a server and syncing actions.

The UI reads state from a Zustand store, which only adds presentation concerns (dice tumbling delay, token-walk timing, toasts, sounds, autosave). A `useAIDriver` hook asks `decideAIAction(state)` what the computer wants to do and dispatches it after a short delay.

## Project structure

```
src/
  assets/               Notes on generated assets (sound is synthesised at runtime)
  components/
    board/              GameBoard, BoardTile, PlayerToken (+ TokenAvatar)
    dice/               Dice (3D cube), DiceRoller
    players/            PlayerCard, PlayerSelector
    properties/         PropertyCard, PropertyModal, TradingModal, BuyModal,
                        AuctionModal, DebtModal, TradeOfferModal, PropertyManagerModal
    events/             EventCard, EventModal
    minigames/          DiceDuel, QuickTap, LuckyWheel, MemoryMatch, NumberGuess, MiniGameModal
    ui/                 Button, Modal, GameLog, Toast, FxLayer, GameOverModal, Confetti
  engine/
    gameEngine.ts       createGame, dispatch (single entry point)
    turnManager.ts      turn flow, dice, jail, game end
    movement.ts         walking, jumping, jail
    propertyManager.ts  rent, building, mortgage, selling
    economyManager.ts   payments, debts, net worth
    eventManager.ts     card decks and every card effect
    spaceManager.ts     resolving the space you land on
    auctionManager.ts   auctions
    bankruptcyManager.ts
    tradeManager.ts     trade validation and execution
    ai/                 aiController (decides actions), aiStrategies (personalities)
    __tests__/          Vitest suites
  data/                 boardSpaces, properties, eventCards, miniGames, tokens, gameRules
  store/gameStore.ts    Zustand store
  hooks/useAIDriver.ts
  pages/                MainMenu, GameSetup, GameScreen, Statistics, HowToPlay, Settings
  utils/                random (seeded PRNG), sound, storage, stats, format
  types/                All game interfaces
```

## Testing

```bash
npm test
```

The suites cover board and card data integrity, setup, movement and salary, doubles and jail, buying, rent (sets, houses, stations, utilities, boosts), building and mortgages, taxes and Free Parking, debt and bankruptcy, auctions, trading (including AI fairness), turn validation, end-of-game logic, every one of the 55 cards under four different player situations, and **complete computer-played games** across modes, player counts and 30+ seeds that must always finish with a valid winner and consistent money and property state.

## Deployment

The build output is a static site, so any static host works.

- **Vercel / Netlify / Cloudflare Pages**: build command `npm run build`, output directory `dist`.
- **GitHub Pages**: set `base: '/<repo-name>/'` in `vite.config.ts`, run `npm run build`, and publish `dist/`.
- **Any server**: copy `dist/` to the web root.

## Preparing for online multiplayer

Not implemented (no fake networking). To add it: keep the authoritative `GameState` on a server that runs `dispatch`, send `GameAction`s from clients (the action carries the acting player's id where needed), broadcast the new state, and swap the local store's `act` for a network call.

## License

MIT
