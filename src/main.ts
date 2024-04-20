import { Card, CardAttempt } from "./types.ts";
import { Db, getKv } from "./db.ts";

export function attemptAnswer(card: Card, answer: string): CardAttempt {
  const correct = isAnswerToCardCorrect(card, answer);
  const date = Temporal.Now.plainDateTimeISO().toString();
  return { id: crypto.randomUUID(), cardId: card.id, date, correct };
}

// Card answer checker

function isAnswerToCardCorrect(card: Card, answer: string): boolean {
  switch (card.type) {
    case "text":
      return isTextMatches(card.answer, answer);
    case "phone":
      return isPhoneNumberMatches(card.answer, answer);
    default:
      throw new Error(`Unknown card type: ${card.type}`);
  }
}

function isTextMatches(expected: string, actual: string): boolean {
  return expected.toLowerCase() === actual.toLowerCase();
}

function isPhoneNumberMatches(expected: string, actual: string): boolean {
  return expected.replace(/\D/g, "") === actual.replace(/\D/g, "");
}

/// Paths

if (import.meta.main) {
  const kv = await getKv();
  const userResult = await Db.User.create(kv, { name: "Audrow" });
  if (userResult.isErr()) throw new Error(userResult.unwrapErr());
}
