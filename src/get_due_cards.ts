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
