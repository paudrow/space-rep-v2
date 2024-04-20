import { Db, getKv } from "../src/db.ts";

const kv = await getKv();

const userResult = await Db.User.create(kv, { name: "Audrow" });
if (userResult.isErr()) throw new Error(userResult.unwrapErr());
const user = userResult.unwrap();

const cardResult = await Db.Card.create(kv, user.id, {
  question: "What is your name?",
  answer: "Audrow",
  type: "text",
});

if (cardResult.isErr()) throw new Error(cardResult.unwrapErr());
const card = cardResult.unwrap();

const today = Temporal.Now.plainDateTimeISO();
const cardAttemptResult1 = await Db.CardAttempt.create(kv, user.id, {
  cardId: card.id,
  correct: false,
  date: today.subtract({ days: 4 }).toString(),
});
if (cardAttemptResult1.isErr()) throw new Error(cardAttemptResult1.unwrapErr());

const cardAttemptResult2 = await Db.CardAttempt.create(kv, user.id, {
  cardId: card.id,
  correct: true,
  date: today.subtract({ days: 3 }).toString(),
});
if (cardAttemptResult2.isErr()) throw new Error(cardAttemptResult2.unwrapErr());

console.log("Done seeding database");
