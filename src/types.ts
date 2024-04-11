export interface User {
  id: string;
  name: string;
}

export type CardType = "text" | "phone";

export interface Card {
  id: string;
  question: string;
  hint?: string;
  answer: string;
  type: CardType;
}

export interface CardAttempt {
  id: string;
  cardId: string;
  date: string;
  correct: boolean;
}
