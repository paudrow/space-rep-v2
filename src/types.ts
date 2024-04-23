export interface User {
  id: string;
  name: string;
}

export type CardType =
  | "text"
  | "number"
  | "phone number"
  | "self assesment"
  | "multiple choice"
  | "true or false";

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
