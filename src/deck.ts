export type Random = () => number;

const SUITS = ['H', 'S', 'C', 'D'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function standardDeck(): string[] {
  return SUITS.flatMap((suit) => VALUES.map((value) => value + suit));
}

export function shuffle<T>(cards: readonly T[], random: Random = Math.random): T[] {
  const result = [...cards];
  for (let i = result.length - 1; i >= 1; i--) {
    const j = Math.floor(random() * i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function repeat<T>(cards: readonly T[], times = 1): T[] {
  const result = [...cards];
  for (let i = 1; i < times; i++) {
    result.push(...cards);
  }
  return result;
}

// Keeps several standard decks in rotation, reshuffling them as they are used,
// so consecutive requests don't all start from a freshly ordered deck.
export class DeckPool {
  private readonly decks: string[][];
  private readonly random: Random;

  constructor(random: Random = Math.random, size = 10) {
    this.random = random;
    this.decks = Array.from({ length: size }, () => shuffle(standardDeck(), random));
  }

  deal(numDecks?: number): string[] {
    const index = this.randomIndex();
    const cards = [...this.decks[index]];
    for (let i = 1; numDecks !== undefined && i < numDecks; i++) {
      cards.push(...this.decks[this.randomIndex()]);
    }
    const shuffled = shuffle(cards, this.random);
    if (numDecks === undefined) {
      this.decks[index] = shuffled;
    }
    return shuffled;
  }

  private randomIndex(): number {
    return Math.floor(this.random() * this.decks.length);
  }
}
