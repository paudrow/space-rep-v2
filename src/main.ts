import { Card, CardAttempt, CardType, User } from "./types.ts";

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

// Database

/// Paths

if (import.meta.main) {
  const db = await Deno.openKv();
  const user = newUser({ name: "John Doe" });
  const cards: Card[] = [
    newCard({
      id: "1",
      question: "What is your name?",
      answer: "John Doe",
      type: "text",
    }),
    newCard({
      id: "2",
      question: "What is your phone number?",
      answer: "123-456-7890",
      type: "phone",
    }),
  ];

  const userId = user.id;
  for (const card of cards) {
    const key = getDbCardPath(userId, card.id);
    const result = await db.atomic()
      .check({ key, versionstamp: null })
      .set(key, card)
      .commit();
    if (result.ok) {
      console.log("Value set successfully");
    } else {
      console.error("Key already exists: ", key);
    }
  }

  const card = cards[1];
  // const answer = "Jane Doe";
  // const attempt = attemptAnswer(card, answer);
  // const key = getDbCardAttemptPath(userId, attempt.id);
  // const result = await db.set(key, attempt);
  // if (result) {
  //   console.log("Attempt set successfully");
  // } else {
  //   console.error("Attempt already exists: ", key);
  // }

  // // get all attempts
  // for await (const {key, value} of db.list({prefix: getDbCardAttemptsPath(userId)})) {
  //   console.log(key, value);
  // }

  // await resetDb(db);
}
