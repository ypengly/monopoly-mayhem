// ---------------------------------------------------------------------------
// Core domain types for Monopoly Mayhem. Everything in the engine is plain,
// JSON-serialisable data so it can be saved to LocalStorage or (in future)
// sent over the network.
// ---------------------------------------------------------------------------

export type SpaceType =
  | 'go'
  | 'property'
  | 'railroad'
  | 'utility'
  | 'chance'
  | 'chest'
  | 'tax'
  | 'jail'
  | 'gotojail'
  | 'parking'
  | 'event';

export type ColorGroup =
  | 'brown'
  | 'lightblue'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'darkblue'
  | 'railroad'
  | 'utility';

export interface BoardSpace {
  index: number;
  name: string;
  type: SpaceType;
  emoji: string;
  group?: ColorGroup;
  price?: number;
  /** Rent table for streets: [base, 1 house, 2, 3, 4, hotel]. */
  rent?: number[];
  houseCost?: number;
  /** Tax amount for tax spaces. */
  amount?: number;
}

export type TokenId =
  | 'cat'
  | 'robot'
  | 'penguin'
  | 'dinosaur'
  | 'astronaut'
  | 'duck'
  | 'fox'
  | 'alien';

export type AIPersonality = 'investor' | 'banker' | 'trader' | 'gambler';
export type GameMode = 'quick' | 'classic' | 'chaos' | 'solo' | 'local' | 'online';
export type GameLength = 'quick' | 'standard' | 'long';
export type MiniGameId = 'diceDuel' | 'quickTap' | 'luckyWheel' | 'memoryMatch' | 'numberGuess';

export interface GameSettings {
  mode: GameMode;
  length: GameLength;
  startingCash: number;
  salary: number;
  chaosEvents: boolean;
  miniGames: boolean;
  freeParkingJackpot: boolean;
  auctions: boolean;
  seed: number;
}

export interface PlayerConfig {
  name: string;
  tokenId: TokenId;
  isAI: boolean;
  personality?: AIPersonality;
}

export interface PlayerStats {
  earned: number;
  biggestRentPaid: number;
  rentCollected: number;
}

export interface Player {
  id: string;
  name: string;
  tokenId: TokenId;
  color: string;
  isAI: boolean;
  personality?: AIPersonality;
  cash: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  jailCards: number;
  bankrupt: boolean;
  skipNextMove: boolean;
  stats: PlayerStats;
}

export interface PropertyState {
  ownerId: string | null;
  houses: number; // 0-4 houses, 5 = hotel
  mortgaged: boolean;
  /** Rent multiplier granted by "Property Boom" style events. */
  rentBoost: number;
}

// ----- Event cards ---------------------------------------------------------

export type CardEffect =
  | { kind: 'cash'; amount: number }
  | { kind: 'collectFromEach'; amount: number }
  | { kind: 'payEach'; amount: number }
  | { kind: 'moveForward'; steps: number }
  | { kind: 'moveBack'; steps: number }
  | { kind: 'moveTo'; index: number }
  | { kind: 'nearestRailroad' }
  | { kind: 'goToJail' }
  | { kind: 'jailCard' }
  | { kind: 'skipMove' }
  | { kind: 'propertyBoom' }
  | { kind: 'rentHoliday' }
  | { kind: 'crazyAuction' }
  | { kind: 'repairs'; perHouse: number; perHotel: number }
  | { kind: 'perProperty'; amount: number }
  | { kind: 'swapPlaces' }
  | { kind: 'robinHood'; amount: number }
  | { kind: 'coinFlip'; amount: number }
  | { kind: 'freeHouse' }
  | { kind: 'rollAgain' }
  | { kind: 'miniGame'; game: MiniGameId }
  | { kind: 'jackpot' }
  | { kind: 'poorestBonus'; amount: number };

export type CardTone = 'good' | 'bad' | 'wild' | 'neutral';

export interface EventCard {
  id: string;
  deck: 'chaos' | 'treasure';
  title: string;
  text: string;
  emoji: string;
  tone: CardTone;
  effect: CardEffect;
}

// ----- Trading ---------------------------------------------------------------

export interface TradeSide {
  cash: number;
  properties: number[];
  jailCards: number;
}

export interface Trade {
  id: string;
  fromId: string;
  toId: string;
  /** What `fromId` gives to `toId`. */
  offer: TradeSide;
  /** What `fromId` asks to receive from `toId`. */
  request: TradeSide;
}

// ----- Auctions, debt, pending decisions --------------------------------------

export interface AuctionState {
  spaceIndex: number;
  bidderOrder: string[]; // active bidders, in turn order
  turn: number; // index into bidderOrder
  highBidderId: string | null;
  currentBid: number;
  reason: string;
}

export interface Payee {
  to: string; // player id, 'bank' or 'pot'
  amount: number;
}

export interface Debt {
  playerId: string;
  payees: Payee[];
  total: number;
  reason: string;
  isRent: boolean;
}

export type PendingAction =
  | { type: 'buy'; spaceIndex: number }
  | { type: 'card'; card: EventCard }
  | { type: 'minigame'; game: MiniGameId; reason: string; opponentId: string | null }
  | { type: 'tradeOffer'; trade: Trade };

// ----- Log and animation feed ---------------------------------------------------

export type LogTone = 'info' | 'good' | 'bad' | 'event';

export interface LogEntry {
  id: number;
  text: string;
  tone: LogTone;
  round: number;
}

export type GameFx =
  | { id: number; kind: 'money'; playerId: string; amount: number; label: string }
  | { id: number; kind: 'rent'; payerId: string; ownerId: string; amount: number; spaceIndex: number }
  | { id: number; kind: 'purchase'; playerId: string; spaceIndex: number; price: number }
  | { id: number; kind: 'build'; playerId: string; spaceIndex: number; houses: number }
  | { id: number; kind: 'card'; playerId: string; tone: CardTone }
  | { id: number; kind: 'jail'; playerId: string }
  | { id: number; kind: 'bankrupt'; playerId: string }
  | { id: number; kind: 'dice' }
  | { id: number; kind: 'win'; playerId: string }
  | { id: number; kind: 'trade' };

export type GameFxInput = GameFx extends infer T ? (T extends { id: number } ? Omit<T, 'id'> : never) : never;

export interface LastMove {
  id: number;
  playerId: string;
  /** Board indexes visited, in order, including the destination. */
  path: number[];
  kind: 'walk' | 'jump';
}

export type TurnPhase = 'pre-roll' | 'post-roll' | 'game-over';

export interface Standing {
  playerId: string;
  netWorth: number;
  bankrupt: boolean;
}

export interface GameState {
  id: string;
  settings: GameSettings;
  players: Player[];
  properties: Record<number, PropertyState>;
  currentPlayerIndex: number;
  round: number;
  turnCount: number;
  phase: TurnPhase;
  dice: [number, number] | null;
  rolledThisTurn: boolean;
  lastRollDoubles: boolean;
  doublesCount: number;
  extraRoll: boolean;
  pending: PendingAction | null;
  auction: AuctionState | null;
  debt: Debt | null;
  log: LogEntry[];
  fx: GameFx[];
  counter: number;
  winnerId: string | null;
  standings: Standing[];
  freeParkingPot: number;
  rentHolidayTurns: number;
  deckChaos: number[];
  deckTreasure: number[];
  rng: number;
  lastMove: LastMove | null;
  aiTradeTurn: number;
  skippedMove: boolean;
}

// ----- Actions (the only way to change a GameState) -------------------------------

export type GameAction =
  | { type: 'ROLL'; dice?: [number, number] }
  | { type: 'BUY' }
  | { type: 'DECLINE_BUY' }
  | { type: 'RESOLVE_CARD' }
  | { type: 'END_TURN' }
  | { type: 'PAY_JAIL_FINE' }
  | { type: 'USE_JAIL_CARD' }
  | { type: 'BUILD'; index: number }
  | { type: 'SELL_HOUSE'; index: number }
  | { type: 'MORTGAGE'; index: number }
  | { type: 'UNMORTGAGE'; index: number }
  | { type: 'SELL_PROPERTY'; index: number }
  | { type: 'BID'; playerId: string; amount: number }
  | { type: 'PASS_BID'; playerId: string }
  | { type: 'PROPOSE_TRADE'; trade: Omit<Trade, 'id'> }
  | { type: 'ACCEPT_TRADE' }
  | { type: 'REJECT_TRADE' }
  | { type: 'PAY_DEBT' }
  | { type: 'BANKRUPT' }
  | { type: 'MINIGAME_RESULT'; delta: number; message: string; jailCard?: boolean }
  | { type: 'SKIP_MINIGAME' };

export interface DispatchResult {
  state: GameState;
  error: string | null;
}

// ----- Persistent statistics -----------------------------------------------------------

export interface LifetimeStats {
  gamesPlayed: number;
  gamesWon: number;
  propertiesOwned: number;
  totalMoneyEarned: number;
  biggestRent: number;
  mostExpensiveProperty: { name: string; price: number } | null;
}
