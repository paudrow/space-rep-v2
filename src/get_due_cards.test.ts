import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assert, assertEquals } from "@std/assert";
import { Card, User } from "./types.ts";
import { Db } from "./db.ts";
import { getDueCards } from "./get_due_cards.ts";

const today = Temporal.Now.plainDateTimeISO();

describe("getDueCards", () => {
  let kv: Deno.Kv;
  let user: User;
  let cards: Card[];

  beforeAll(async () => {
    const file = await Deno.makeTempFile();
    kv = await Deno.openKv(file);

    user = (await Db.User.create(kv, { name: "Audrow" })).expect(
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
    const card3 = (await Db.Card.create(kv, user.id, {
      question: "What is the capital of Italy?",
      answer: "Rome",
      type: "text",
    })).expect("Failed to create card3");
    cards = [card1, card2, card3];

    const _attempt1 = (await Db.CardAttempt.create(kv, user.id, {
      cardId: card1.id,
      correct: true,
      date: today.subtract({ days: 4 }),
    })).expect("Failed to create attempt1");
    const _attempt2 = (await Db.CardAttempt.create(kv, user.id, {
      cardId: card1.id,
      correct: true,
      date: today.subtract({ days: 3 }),
    })).expect("Failed to create attempt2");
    const _attempt3 = (await Db.CardAttempt.create(kv, user.id, {
      cardId: card2.id,
      correct: true,
      date: today.subtract({ days: 10 }),
    })).expect("Failed to create attempt3");
    const _attempt4 = (await Db.CardAttempt.create(kv, user.id, {
      cardId: card2.id,
      correct: true,
      date: today.subtract({ days: 1 }),
    })).expect("Failed to create attempt4");
  });

  afterAll(() => {
    kv.close();
  });

  it("should say the first and third card are due", async () => {
    const dueCardsResult = await getDueCards(kv, user.id);
    assert(
      dueCardsResult.isOk(),
      `Expected dueCardsResult to be Ok but it was ${dueCardsResult}`,
    );
    const dueCards = dueCardsResult.unwrap();
    assertEquals(dueCards.length, 2);
    assertEquals(dueCards[0].card.id, cards[0].id);
    assertEquals(dueCards[1].card.id, cards[2].id);
  });

  it("should say all three cards are due in 20 days", async () => {
    const dueCardsResult = await getDueCards(
      kv,
      user.id,
      today.add({ days: 20 }),
    );
    assert(
      dueCardsResult.isOk(),
      `Expected dueCardsResult to be Ok but it was ${dueCardsResult}`,
    );
    const dueCards = dueCardsResult.unwrap();
    assertEquals(dueCards.length, 3);

    assertEquals(dueCards[0].card.id, cards[0].id);
    assertEquals(dueCards[1].card.id, cards[2].id);
    assertEquals(dueCards[2].card.id, cards[1].id);
  });
});
