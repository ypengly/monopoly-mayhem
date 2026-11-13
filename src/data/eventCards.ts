import type { CardEffect, CardTone, EventCard } from '../types';

function card(
  id: string,
  deck: 'chaos' | 'treasure',
  tone: CardTone,
  emoji: string,
  title: string,
  text: string,
  effect: CardEffect,
): EventCard {
  return { id, deck, tone, emoji, title, text, effect };
}

// ---------------------------------------------------------------------------
// CHAOS DECK - drawn on Chaos Card spaces, and randomly in Chaos Mode.
// ---------------------------------------------------------------------------
export const CHAOS_CARDS: EventCard[] = [
  card('pizza-party', 'chaos', 'good', '🍕', 'Pizza Party!', 'You throw a pizza party. Every guest chips in $25 for the cheesy goodness.', { kind: 'collectFromEach', amount: 25 }),
  card('rich-uncle', 'chaos', 'good', '🤑', 'Rich Uncle', 'Your long-lost rich uncle sends a suspiciously large cheque. Collect $150.', { kind: 'cash', amount: 150 }),
  card('bank-error', 'chaos', 'good', '🏧', 'Bank Error In Your Favor', 'The bank sneezed and accidentally deposited $200 into your account.', { kind: 'cash', amount: 200 }),
  card('broken-elevator', 'chaos', 'bad', '🛗', 'Broken Elevator', 'You got stuck for 3 hours. The repair fee is $75.', { kind: 'cash', amount: -75 }),
  card('tax-inspection', 'chaos', 'bad', '🕵️', 'Tax Inspection', 'A very serious inspector sniffs your paperwork. Pay $20 for every property you own.', { kind: 'perProperty', amount: -20 }),
  card('lucky-day', 'chaos', 'good', '🍀', 'Lucky Day', 'A four-leaf clover floats by. Skip merrily forward 3 spaces!', { kind: 'moveForward', steps: 3 }),
  card('traffic-jam', 'chaos', 'bad', '🚗', 'Traffic Jam', 'Honk honk! You are stuck in traffic and will skip your next movement.', { kind: 'skipMove' }),
  card('property-boom', 'chaos', 'good', '📈', 'Property Boom', 'The neighborhood is trending! One of your properties now charges 50% more rent.', { kind: 'propertyBoom' }),
  card('rent-holiday', 'chaos', 'neutral', '🏖️', 'Rent Holiday', 'Everybody relax! Nobody collects rent for one full round.', { kind: 'rentHoliday' }),
  card('crazy-auction', 'chaos', 'wild', '🔨', 'Crazy Auction', 'A random free property is dragged onto the stage. Everyone bids!', { kind: 'crazyAuction' }),
  card('banana-peel', 'chaos', 'bad', '🍌', 'Banana Peel', 'Whoa! You slip and slide 3 spaces backwards.', { kind: 'moveBack', steps: 3 }),
  card('teleporter', 'chaos', 'good', '🛰️', 'Wobbly Teleporter', 'A teleporter beams you straight to Start. Collect your salary!', { kind: 'moveTo', index: 0 }),
  card('space-elevator', 'chaos', 'wild', '🛗', 'Space Elevator', 'Whoosh! You are launched to Galaxy Gardens. Hope you can afford the view.', { kind: 'moveTo', index: 39 }),
  card('robin-hood', 'chaos', 'wild', '🏹', 'Robin Hood Day', 'Take $100 from the richest player and give it to the poorest. Justice!', { kind: 'robinHood', amount: 100 }),
  card('coin-flip', 'chaos', 'wild', '🪙', 'Double Or Nothing', 'Flip a coin: heads you win $150, tails you pay $150. Brave or silly?', { kind: 'coinFlip', amount: 150 }),
  card('swap-places', 'chaos', 'wild', '🔄', 'Body Swap', 'Freaky Friday! You trade board positions with a random opponent.', { kind: 'swapPlaces' }),
  card('free-house', 'chaos', 'good', '🏗️', 'Free Renovation', 'A friendly construction crew builds a free house on one of your colour sets.', { kind: 'freeHouse' }),
  card('double-espresso', 'chaos', 'good', '☕', 'Double Espresso', 'Zoom zoom! You get an extra roll right now.', { kind: 'rollAgain' }),
  card('jackpot', 'chaos', 'good', '🎰', 'Free Parking Jackpot', 'Ding ding ding! You win everything in the Free Parking pot.', { kind: 'jackpot' }),
  card('gremlins', 'chaos', 'bad', '👹', 'Repair Gremlins', 'Gremlins chewed your buildings. Pay $25 per house and $100 per hotel.', { kind: 'repairs', perHouse: 25, perHotel: 100 }),
  card('party-crashers', 'chaos', 'bad', '🥳', 'Party Crashers', 'Your party got crashed and you must buy snacks. Pay each player $20.', { kind: 'payEach', amount: 20 }),
  card('dance-cops', 'chaos', 'bad', '🕺', 'Illegal Dance Moves', 'Your moves were too smooth. Go directly to Jail!', { kind: 'goToJail' }),
  card('express-lane', 'chaos', 'good', '🚄', 'Express Lane', 'Hop on the nearest transit line. Advance to the nearest station!', { kind: 'nearestRailroad' }),
  card('charity-raffle', 'chaos', 'neutral', '🎟️', 'Charity Raffle', 'The poorest player wins a $150 raffle. Aww.', { kind: 'poorestBonus', amount: 150 }),
  card('stock-surge', 'chaos', 'good', '💹', 'Stock Surge', 'Your meme-coin portfolio mooned. Collect $100.', { kind: 'cash', amount: 100 }),
  card('lost-wallet', 'chaos', 'bad', '👛', 'Lost Wallet', 'You dropped your wallet in a fountain. Lose $60.', { kind: 'cash', amount: -60 }),
  card('cosmic-pass', 'chaos', 'good', '🌠', 'Cosmic Get Out Of Jail Free', 'The universe owes you one. Keep this card until you need it.', { kind: 'jailCard' }),
  card('wheel-ticket', 'chaos', 'wild', '🎡', 'Lucky Wheel Ticket', 'You found a golden ticket for the Lucky Wheel! Spin for prizes.', { kind: 'miniGame', game: 'luckyWheel' }),
  card('tap-contest', 'chaos', 'wild', '👆', 'Finger Frenzy', 'A tapping contest breaks out! Tap as fast as you can.', { kind: 'miniGame', game: 'quickTap' }),
  card('duel-challenge', 'chaos', 'wild', '⚔️', 'Dice Duel Challenge', 'An opponent challenges you to a dice duel for $50!', { kind: 'miniGame', game: 'diceDuel' }),
  card('memory-lane', 'chaos', 'wild', '🧠', 'Memory Lane', 'Match the cards to earn bonus money. Do not forget!', { kind: 'miniGame', game: 'memoryMatch' }),
  card('guess-who', 'chaos', 'wild', '🔢', 'Mystery Number', 'Guess the hidden number between 1 and 10 to win a prize.', { kind: 'miniGame', game: 'numberGuess' }),
];

// ---------------------------------------------------------------------------
// TREASURE DECK - drawn on Treasure Chest spaces. Friendlier overall.
// ---------------------------------------------------------------------------
export const TREASURE_CARDS: EventCard[] = [
  card('birthday', 'treasure', 'good', '🎂', 'It Is Your Birthday', 'Everyone sings off-key and gives you $15.', { kind: 'collectFromEach', amount: 15 }),
  card('tax-refund', 'treasure', 'good', '💸', 'Tax Refund', 'The tax office found a typo in your favor. Collect $50.', { kind: 'cash', amount: 50 }),
  card('lottery', 'treasure', 'good', '🎫', 'Scratch Ticket Winner', 'Scratch, scratch... jackpot! Collect $100.', { kind: 'cash', amount: 100 }),
  card('hospital', 'treasure', 'bad', '🩹', 'Skateboard Accident', 'You tried a kickflip. Pay $50 in band-aids.', { kind: 'cash', amount: -50 }),
  card('piggy-bank', 'treasure', 'good', '🐷', 'Piggy Bank Smash', 'You smash the piggy bank. $25 rolls out!', { kind: 'cash', amount: 25 }),
  card('old-toys', 'treasure', 'good', '🧸', 'Garage Sale', 'You sell your old toys for $45.', { kind: 'cash', amount: 45 }),
  card('inheritance', 'treasure', 'good', '📜', 'Mystery Inheritance', 'A distant cousin you never met left you $100.', { kind: 'cash', amount: 100 }),
  card('library-fine', 'treasure', 'bad', '📚', 'Overdue Library Book', 'It was due in 1997. Pay a $15 fine.', { kind: 'cash', amount: -15 }),
  card('get-out-free', 'treasure', 'good', '🗝️', 'Get Out Of Jail Free', 'Keep this card until you need it. Or trade it!', { kind: 'jailCard' }),
  card('advance-start', 'treasure', 'good', '🏁', 'Advance To Start', 'Zip! Move to Start and collect your salary.', { kind: 'moveTo', index: 0 }),
  card('street-repairs', 'treasure', 'bad', '🚧', 'Street Repairs', 'Pay $40 per house and $115 per hotel you own.', { kind: 'repairs', perHouse: 40, perHotel: 115 }),
  card('pet-fee', 'treasure', 'bad', '🐶', 'Puppy Adoption Fee', 'Worth every cent. Pay $40.', { kind: 'cash', amount: -40 }),
  card('cookie-sale', 'treasure', 'good', '🍪', 'Cookie Stand', 'Grandma sells your cookies for a tidy $30 profit.', { kind: 'cash', amount: 30 }),
  card('startup', 'treasure', 'good', '🚀', 'Startup Payout', 'Your cousin\'s app sold for millions. Your cut: $120.', { kind: 'cash', amount: 120 }),
  card('treasure-map', 'treasure', 'good', '🗺️', 'Found A Treasure Map', 'X marks $20. You dig it up.', { kind: 'cash', amount: 20 }),
  card('flat-tire', 'treasure', 'bad', '🛞', 'Flat Tire', 'Pay $45 for a new tire and a lollipop.', { kind: 'cash', amount: -45 }),
  card('noise-complaint', 'treasure', 'bad', '🔊', 'Noise Complaint', 'You played the tuba at 3am. Pay each player $10.', { kind: 'payEach', amount: 10 }),
  card('property-refund', 'treasure', 'good', '🏛️', 'Property Tax Refund', 'Collect $10 for every property you own.', { kind: 'perProperty', amount: 10 }),
  card('lucky-streak', 'treasure', 'good', '🎲', 'Lucky Streak', 'Roll the dice again!', { kind: 'rollAgain' }),
  card('treasure-wheel', 'treasure', 'wild', '🎡', 'Carnival Ticket', 'Spin the Lucky Wheel for a prize!', { kind: 'miniGame', game: 'luckyWheel' }),
  card('treasure-guess', 'treasure', 'wild', '🔮', 'Fortune Teller', 'Guess the number the fortune teller is thinking of.', { kind: 'miniGame', game: 'numberGuess' }),
  card('talent-show', 'treasure', 'good', '🎭', 'Talent Show Winner', 'You juggle three flaming pizzas. Win $60.', { kind: 'cash', amount: 60 }),
  card('mystery-box', 'treasure', 'wild', '📦', 'Mystery Box', 'Open the box... double or nothing on $100!', { kind: 'coinFlip', amount: 100 }),
];

export const ALL_CARDS: EventCard[] = [...CHAOS_CARDS, ...TREASURE_CARDS];
