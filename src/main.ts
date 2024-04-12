import { Card, CardAttempt } from "./types.ts";
import { Db } from "./db.ts";

function attemptAnswer(card: Card, answer: string): CardAttempt {
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
  const kv = await Deno.openKv();

  const user = await Db.User.create(kv, { name: "Audrow" });
  if (!user) throw new Error("User not created");

  const card = await Db.Card.create(kv, user.id, {
    question: "What is your name?",
    answer: "Audrow",
    type: "text",
  });
  if (!card) throw new Error("Card not created");

  {
    const cardAttempt = await Db.CardAttempt.create(
      kv,
      user.id,
      attemptAnswer(card, "PAudrow"),
    );
    if (!cardAttempt) throw new Error("Card attempt not created");
  }
  {
    const cardAttempt = await Db.CardAttempt.create(
      kv,
      user.id,
      attemptAnswer(card, "Audrow"),
    );
    if (!cardAttempt) throw new Error("Card attempt not created");
  }
  const attempts = await Db.CardAttempt.readAll(kv, user.id);
  console.log(
    attempts.map((a) => `${a.date}: ${a.correct ? "Correct" : "Incorrect"}`)
      .join("\n"),
  );

  await Db.reset(kv);
}
