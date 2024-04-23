import { Card } from "./types.ts";
import { Err, Ok, Result } from "@oxi/result";
import {
  nextAttemptDateTime,
  NextAttemptOptions,
} from "./helpers/next_attempt_date_time.ts";
import { Db } from "./db.ts";

export async function getDueCards(
  kv: Deno.Kv,
  userId: string,
  dateTime?: Temporal.PlainDateTime,
): Promise<Result<CardAndNextAttempt[], string>> {
  const cardDateTimesResult = await getNextAttemptsForCards(kv, userId);
  if (cardDateTimesResult.isErr()) {
    return cardDateTimesResult;
  }
  const cardDateTimes = cardDateTimesResult.unwrap();

  if (cardDateTimes.length === 0) {
    return Ok([]);
  }

  if (!dateTime) {
    dateTime = Temporal.Now.plainDateTimeISO();
  }
  const dueCardAndAttempts: CardAndNextAttempt[] = [];
  for (const cardDateTime of cardDateTimes) {
    if (
      Temporal.PlainDateTime.compare(cardDateTime.nextAttempt, dateTime) <= 0
    ) {
      dueCardAndAttempts.push(cardDateTime);
    }
  }
  return Ok(dueCardAndAttempts);
}

export const exportForTesting = {
  getCardNextAttempt,
  getNextAttemptsForCards,
};

type CardAndNextAttempt = {
  card: Card;
  nextAttempt: Temporal.PlainDateTime;
};

async function getNextAttemptsForCards(
  kv: Deno.Kv,
  userId: string,
): Promise<Result<CardAndNextAttempt[], string>> {
  const cards = await Db.Card.readAll(kv, userId);
  const out: CardAndNextAttempt[] = [];
  for (const card of cards) {
    const nextAttemptResult = await getCardNextAttempt(kv, userId, card.id);
    if (nextAttemptResult.isErr()) {
      return Err(nextAttemptResult.unwrapErr());
    }
    const nextAttempt = nextAttemptResult.unwrap();
    out.push({ card, nextAttempt });
  }
  out.sort((a, b) =>
    Temporal.PlainDateTime.compare(a.nextAttempt, b.nextAttempt)
  );
  return Ok(out);
}

async function getCardNextAttempt(
  kv: Deno.Kv,
  userId: string,
  cardId: string,
  options?: NextAttemptOptions,
): Promise<Result<Temporal.PlainDateTime, string>> {
  const attempts = await Db.CardAttempt.readAllForCardId(kv, userId, cardId);
  return nextAttemptDateTime(attempts, options);
}

if (import.meta.main) {
  const kv = await Deno.openKv();

  await Db.reset(kv);

  const user = (await Db.User.create(kv, { name: "Audrow" })).expect(
    "Failed to create user",
  );
  const card1 = (await Db.Card.create(kv, user.id, {
    question: "What is the capital of France?",
    answer: "Paris",
    type: "text",
  })).expect("Failed to create card1");
  const card2 = (await Db.Card.create(kv, user.id, {
    question: "What is the capital of Germany?",
    answer: "Berlin",
    type: "text",
  })).expect("Failed to create card2");
  const _card3 = (await Db.Card.create(kv, user.id, {
    question: "What is the capital of Italy?",
    answer: "Rome",
    type: "text",
  })).expect("Failed to create card3");

  const _attempt1 = (await Db.CardAttempt.create(kv, user.id, {
    cardId: card1.id,
    correct: true,
    date: Temporal.Now.plainDateTimeISO().subtract({ days: 4 }),
  })).expect("Failed to create attempt1");
  const _attempt2 = (await Db.CardAttempt.create(kv, user.id, {
    cardId: card1.id,
    correct: true,
    date: Temporal.Now.plainDateTimeISO().subtract({ days: 3 }),
  })).expect("Failed to create attempt2");
  const _attempt3 = (await Db.CardAttempt.create(kv, user.id, {
    cardId: card2.id,
    correct: true,
    date: Temporal.Now.plainDateTimeISO().subtract({ days: 10 }),
  })).expect("Failed to create attempt3");
  const _attempt4 = (await Db.CardAttempt.create(kv, user.id, {
    cardId: card2.id,
    correct: true,
    date: Temporal.Now.plainDateTimeISO().subtract({ days: 1 }),
  })).expect("Failed to create attempt4");

  const dueCards = await getDueCards(
    kv,
    user.id,
    Temporal.Now.plainDateTimeISO().add({ days: 20 }),
  );
  for (const dueCard of dueCards.unwrap()) {
    console.log(dueCard.card.question, dueCard.nextAttempt.toString());
  }
}
